import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCompany, rateLimited } from '@/lib/auth/server';
import { createPayrollRun, ensureCompanyViewingKey, listContractors } from '@/lib/db/client';
import { prepareProof, prepareAggregateProof } from '@/lib/payments/flow';
import { sealWitness } from '@/lib/zk/disclosure';

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
 * POST /api/payroll/prepare — the non-custodial first half. Generates the
 * Groth16 proof for each line server-side (the circuit artifacts live on disk),
 * but signs NOTHING and never touches a company key. It returns the inputs the
 * company's own wallet needs to call verify_and_record itself, plus the sealed
 * disclosure ciphertext to round-trip back at /record. The amount plaintext and
 * randomness never leave the server: only the commitment and the sealed blob do.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimited(req, 'payroll', 10, 60_000);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  const company = auth.company;
  const { reference, lines } = parsed.data;

  for (const l of lines) {
    if (l.amountUsdc < l.minUsdc || l.amountUsdc > l.maxUsdc) {
      return NextResponse.json(
        { error: `${l.workerName}: amount outside range [${l.minUsdc}, ${l.maxUsdc}]` },
        { status: 422 },
      );
    }
  }

  // Enforce the on-chain identity anchor: only anchored contractors of THIS
  // company can be paid.
  let anchored: Set<string>;
  try {
    const contractors = await listContractors(company.id);
    anchored = new Set(
      contractors.filter((c) => c.anchored && c.stellar_address).map((c) => c.stellar_address!),
    );
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
  for (const l of lines) {
    if (!anchored.has(l.workerAddress)) {
      return NextResponse.json(
        { error: `${l.workerName}: identity is not anchored on-chain. The collaborator must finish their identity anchor before being paid.` },
        { status: 422 },
      );
    }
  }

  try {
    const viewingKey = await ensureCompanyViewingKey(company.id);
    const run = await createPayrollRun(company.id, reference);

    const prepared = [];
    // Witnesses for the aggregate Proof-of-Payroll. Kept server-side only; the
    // randomness never leaves in the response (only the aggregate proof does).
    const aggWitness = [];
    for (const l of lines) {
      const input = { ...l, reference };
      const p = await prepareProof({ input }); // random binding; the wallet settles separately
      const disclosure = sealWitness(viewingKey, { amountCents: p.amountCents, randomness: p.randomness });
      prepared.push({
        workerName: l.workerName,
        workerAddress: l.workerAddress,
        reference,
        minUsdc: l.minUsdc,
        maxUsdc: l.maxUsdc,
        amountCents: p.amountCents,
        commitment: p.commitment,
        disclosure,
        // hex inputs for the client-built verify_and_record call:
        workerAddressHash: p.workerAddressHash.toString('hex'),
        paymentTxHash: p.paymentTxHash.toString('hex'),
        valueCommitment: p.valueCommitment.toString('hex'),
        proofBytes: p.proofBytes.toString('hex'),
        publicSignalsBytes: p.publicSignalsBytes.toString('hex'),
      });
      aggWitness.push({
        value: p.amountCents,
        randomness: p.randomness,
        commitment: p.commitment,
        minValue: Math.round(l.minUsdc * 100),
        maxValue: Math.round(l.maxUsdc * 100),
      });
    }

    // Aggregate Proof-of-Payroll: the company wallet records it on-chain itself.
    // Best-effort, so a failure here never blocks the per-payment proofs.
    let aggregate = null;
    try {
      const agg = await prepareAggregateProof({ runId: run.id, reference, lines: aggWitness });
      aggregate = {
        runRef: agg.runRef.toString('hex'),
        total: agg.total,
        proofBytes: agg.proofBytes.toString('hex'),
        publicSignalsBytes: agg.publicSignalsBytes.toString('hex'),
      };
    } catch (e) {
      console.error('aggregate payroll proof prepare failed', e);
    }

    // runId is the numeric internal id: /record uses it to set payments.run_id and
    // to finalize the run. runPublicId is the opaque id for the /payroll/[run] URL.
    return NextResponse.json({
      ok: true,
      runId: run.id,
      runPublicId: run.public_id,
      reference,
      lines: prepared,
      aggregate,
    });
  } catch (e) {
    console.error('payroll prepare failed', e);
    return NextResponse.json({ error: 'payroll prepare failed' }, { status: 500 });
  }
}
