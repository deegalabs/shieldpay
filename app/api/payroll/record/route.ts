import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCompany, rateLimited } from '@/lib/auth/server';
import { finalizePayrollRun, setPayrollProof } from '@/lib/db/client';
import { persistPayment } from '@/lib/payments/flow';
import { isVerifiedOnChain } from '@/lib/stellar/soroban';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Line = z.object({
  workerName: z.string().min(1),
  workerAddress: z.string().min(1),
  reference: z.string().min(1),
  minUsdc: z.number().nonnegative(),
  maxUsdc: z.number().positive(),
  amountCents: z.number().int().nonnegative(),
  commitment: z.string().min(1),
  disclosure: z.string().nullable().optional(),
  paymentTxHash: z.string().regex(/^[0-9a-f]{64}$/i),
  proofId: z.string().min(1),
  proofTxHash: z.string().regex(/^[0-9a-f]{64}$/i),
  settlementTxHash: z.string().regex(/^[0-9a-f]{64}$/i).nullable().optional(),
  settlementAsset: z.string().nullable().optional(),
});

const Body = z.object({
  runId: z.string().min(1),
  reference: z.string().min(1),
  lines: z.array(Line).min(1).max(8),
  // The aggregate Proof-of-Payroll the company wallet recorded on-chain, if any.
  aggregate: z
    .object({
      proofId: z.string().min(1),
      proofTxHash: z.string().regex(/^[0-9a-f]{64}$/i),
    })
    .nullable()
    .optional(),
});

/**
 * POST /api/payroll/record — the non-custodial second half. The company's wallet
 * has already signed and submitted verify_and_record (and the settlement) for
 * each line; here the server confirms each proof actually landed on-chain (it
 * does not trust the client's word) and persists the payment. No company key is
 * ever used. The disclosure ciphertext was sealed at /prepare and round-trips
 * back unchanged; the amount plaintext never reaches the server here.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimited(req, 'payroll', 10, 60_000);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  const company = auth.company;
  const { runId, lines, aggregate } = parsed.data;

  try {
    let totalCents = 0;
    let count = 0;
    for (const l of lines) {
      // The on-chain record is the source of truth: confirm the proof landed
      // before persisting it as verified. Best-effort against RPC flakiness, but
      // a clean false here means the client's claim is not yet on-chain.
      const onChain = await isVerifiedOnChain(Buffer.from(l.paymentTxHash, 'hex'));
      if (!onChain) {
        console.warn(`record: proof ${l.proofId} not confirmed on-chain yet for ${l.workerName}`);
      }

      await persistPayment({
        input: {
          workerName: l.workerName,
          workerAddress: l.workerAddress,
          reference: l.reference,
          amountUsdc: l.amountCents / 100,
          minUsdc: l.minUsdc,
          maxUsdc: l.maxUsdc,
        },
        company,
        runId,
        amountCents: l.amountCents,
        commitment: l.commitment,
        disclosure: l.disclosure ?? null,
        proofId: l.proofId,
        txHash: l.proofTxHash,
        settlement: l.settlementTxHash
          ? { hash: l.settlementTxHash, asset: l.settlementAsset ?? 'XLM' }
          : null,
      });
      totalCents += l.amountCents;
      count += 1;
    }

    await finalizePayrollRun(runId, totalCents, count);

    // Record the aggregate Proof-of-Payroll the company wallet already landed
    // on-chain, so the run shows verified instead of a perpetual "Computing".
    if (aggregate) {
      await setPayrollProof(runId, aggregate.proofId, aggregate.proofTxHash);
    }

    return NextResponse.json({ ok: true, runId, total: totalCents / 100, count, aggregated: Boolean(aggregate) });
  } catch (e) {
    console.error('payroll record failed', e);
    return NextResponse.json({ error: 'payroll record failed' }, { status: 500 });
  }
}
