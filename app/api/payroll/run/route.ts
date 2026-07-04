import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCompany, rateLimited } from '@/lib/auth/server';
import {
  createPayrollRun,
  finalizePayrollRun,
  ensureCompanyViewingKey,
  listContractors,
} from '@/lib/db/client';
import { proveAndRecordPayment, recordRunAggregateProof, type PaymentResult } from '@/lib/payments/flow';
import { ComplianceError } from '@/lib/compliance';
import { ServerSigner } from '@/lib/stellar/signer';

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
 * POST /api/payroll/run, a confidential payroll run (batch).
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

  // Enforce the identity anchor: only anchored contractors of THIS company can
  // be paid. The anchor is the on-chain address-to-identity binding, so paying
  // an un-anchored address would settle without that link.
  let anchoredAddresses: Set<string>;
  try {
    const contractors = await listContractors(company.id);
    anchoredAddresses = new Set(
      contractors.filter((c) => c.anchored && c.stellar_address).map((c) => c.stellar_address!),
    );
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
  for (const l of lines) {
    if (!anchoredAddresses.has(l.workerAddress)) {
      return NextResponse.json(
        {
          error: `${l.workerName}: identity is not anchored on-chain. The collaborator must finish their identity anchor before being paid.`,
        },
        { status: 422 },
      );
    }
  }

  try {
    // Ensure the company viewing key once so each payment's amount is sealed
    // for later authorized disclosure (N4).
    const viewingKey = await ensureCompanyViewingKey(company.id);
    const run = await createPayrollRun(company.id, reference);
    const results: PaymentResult[] = [];
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
      results.push(r);
    }

    await finalizePayrollRun(run.id, totalCents, results.length);

    // Prove the WHOLE run at once: one on-chain proof that the total is correct
    // and every amount is in range, revealing no salary (Proof-of-Payroll).
    const aggregate = await recordRunAggregateProof({
      signer: new ServerSigner(companySecret),
      runId: run.id,
      reference,
      results,
    });

    return NextResponse.json({
      ok: true,
      runId: run.public_id, // opaque id for the /payroll/[run] URL (never the numeric id)
      reference,
      total: totalCents / 100,
      count: results.length,
      settled: results.filter((r) => r.settlementTxHash).length,
      payrollProof: aggregate,
      lines: results.map((r) => ({
        workerName: r.payment.worker_name,
        proofId: r.proofId,
        txHash: r.txHash,
        settlementTxHash: r.settlementTxHash,
      })),
    });
  } catch (e) {
    if (e instanceof ComplianceError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    console.error('payroll run failed', e);
    return NextResponse.json({ error: 'payroll run failed' }, { status: 500 });
  }
}
