import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/server';
import {
  getCompanyByOwner,
  createPayrollRun,
  finalizePayrollRun,
  ensureCompanyViewingKey,
} from '@/lib/db/client';
import { proveAndRecordPayment } from '@/lib/payments/flow';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const Line = z.object({
  workerName: z.string().min(1),
  workerAddress: z.string().min(1),
  amountUsdc: z.number().positive(),
  minUsdc: z.number().nonnegative(),
  maxUsdc: z.number().positive(),
});

const Body = z.object({
  reference: z.string().min(1),
  lines: z.array(Line).min(1).max(8),
});

/**
 * POST /api/payroll/run — a confidential payroll run (batch).
 * Each line is proven + recorded on-chain with its amount private; the run
 * stores the total (the company can prove it to an auditor later via N4).
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(`payroll:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429, headers: { 'retry-after': String(rl.retryAfter) } });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const companySecret = process.env.COMPANY_SECRET_KEY;
  if (!companySecret) return NextResponse.json({ error: 'COMPANY_SECRET_KEY not configured' }, { status: 500 });

  const session = await getSession();
  const company = session ? await getCompanyByOwner(session.sub) : null;
  if (!company) return NextResponse.json({ error: 'company not found' }, { status: 403 });

  const { reference, lines } = parsed.data;

  // Validate ranges up front (fail fast before any on-chain work).
  for (const l of lines) {
    if (l.amountUsdc < l.minUsdc || l.amountUsdc > l.maxUsdc) {
      return NextResponse.json(
        { error: `${l.workerName}: amount outside range [${l.minUsdc}, ${l.maxUsdc}]` },
        { status: 422 },
      );
    }
  }

  try {
    // Ensure the company viewing key once so each payment's amount is sealed
    // for later authorized disclosure (N4).
    const viewingKey = await ensureCompanyViewingKey(company.id);
    const run = await createPayrollRun(company.id, reference);
    const results: Array<{
      workerName: string;
      proofId: string;
      txHash: string;
      settlementTxHash: string | null;
    }> = [];
    let totalCents = 0;

    // Sequential: the company key is the source; each tx needs a fresh sequence.
    for (const l of lines) {
      const r = await proveAndRecordPayment({
        companySecret,
        company,
        input: { ...l, reference },
        runId: run.id,
        viewingKey,
      });
      totalCents += r.amountCents;
      results.push({
        workerName: l.workerName,
        proofId: r.proofId,
        txHash: r.txHash,
        settlementTxHash: r.settlementTxHash,
      });
    }

    await finalizePayrollRun(run.id, totalCents, results.length);

    return NextResponse.json({
      ok: true,
      runId: run.id,
      reference,
      total: totalCents / 100,
      count: results.length,
      settled: results.filter((r) => r.settlementTxHash).length,
      lines: results,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}
