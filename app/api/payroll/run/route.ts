import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCompany, rateLimited } from '@/lib/auth/server';
import { createPayrollRun, finalizePayrollRun, ensureCompanyViewingKey } from '@/lib/db/client';
import { proveAndRecordPayment } from '@/lib/payments/flow';

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
  const limited = rateLimited(req, 'payroll', 10, 60_000);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const companySecret = process.env.COMPANY_SECRET_KEY;
  if (!companySecret) return NextResponse.json({ error: 'COMPANY_SECRET_KEY not configured' }, { status: 500 });

  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  const company = auth.company;

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
    console.error('payroll run failed', e);
    return NextResponse.json({ error: 'payroll run failed' }, { status: 500 });
  }
}
