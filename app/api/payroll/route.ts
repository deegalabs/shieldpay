import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { generatePaymentProof } from '@/lib/zk/prover';
import { poseidonCommitment, randomFieldElement } from '@/lib/zk/commitment';
import { encodeProof, encodePublicSignals, fieldToBe32 } from '@/lib/zk/encode';
import { recordProofOnChain } from '@/lib/stellar/soroban';
import { insertPayment, getCompanyByOwner } from '@/lib/db/client';
import { getSession } from '@/lib/auth/server';
import { EXPLORER_BASE, COMPANY } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/payroll
 * The hero flow: pay a worker within their contractual range and PROVE it.
 *   1. commit to the amount (Poseidon)
 *   2. generate a Groth16 proof that amount ∈ [min, max] (exact value hidden)
 *   3. verify + record the proof ON-CHAIN in the PaymentVerifier Soroban contract
 *
 * Returns the on-chain transaction so the result is independently verifiable.
 * (The native USDC transfer is a follow-up step; this endpoint proves payment
 * validity, which is the ZK core.)
 */
const Body = z.object({
  workerName: z.string().min(1),
  workerAddress: z.string().min(1),
  amountUsdc: z.number().positive(),
  minUsdc: z.number().nonnegative(),
  maxUsdc: z.number().positive(),
  reference: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { workerName, workerAddress, amountUsdc, minUsdc, maxUsdc, reference } = parsed.data;

  const companySecret = process.env.COMPANY_SECRET_KEY;
  if (!companySecret) {
    return NextResponse.json({ error: 'COMPANY_SECRET_KEY not configured' }, { status: 500 });
  }

  // USDC -> integer cents for the circuit.
  const value = Math.round(amountUsdc * 100);
  const minValue = Math.round(minUsdc * 100);
  const maxValue = Math.round(maxUsdc * 100);

  if (value < minValue || value > maxValue) {
    return NextResponse.json(
      { error: `amount ${amountUsdc} is outside the contractual range [${minUsdc}, ${maxUsdc}]` },
      { status: 422 },
    );
  }

  try {
    // 1. commitment
    const randomness = randomFieldElement();
    const commitment = await poseidonCommitment(value, randomness);

    // 2. proof
    const { proof, publicSignals } = await generatePaymentProof({
      value,
      valueRandomness: randomness,
      valueCommitment: commitment,
      minValue,
      maxValue,
    });

    // 3. encode + record on-chain
    const proofBytes = encodeProof(proof);
    const publicSignalsBytes = encodePublicSignals(publicSignals);
    const workerAddressHash = createHash('sha256').update(workerAddress).digest();
    const valueCommitment = fieldToBe32(commitment);
    const paymentTxHash = randomBytes(32); // unique reference for this payment record

    const { proofId, txHash } = await recordProofOnChain({
      companySecret,
      workerAddressHash,
      paymentTxHash,
      valueCommitment,
      proofBytes,
      publicSignalsBytes,
    });

    // 4. persist (off-chain metadata; exact amount intentionally not stored)
    let persisted = true;
    try {
      const session = await getSession();
      const company = session ? await getCompanyByOwner(session.sub) : null;
      await insertPayment({
        worker_name: workerName,
        worker_address: workerAddress,
        reference,
        range_min: minValue,
        range_max: maxValue,
        value_commitment: commitment,
        proof_id: proofId,
        tx_hash: txHash,
        verified: true,
        company_id: company?.id ?? null,
        payer_name: company?.name ?? COMPANY.name,
        payer_cnpj: company?.cnpj ?? COMPANY.cnpj,
      });
    } catch (dbErr) {
      console.error('payment persisted off-chain failed (on-chain proof stands)', dbErr);
      persisted = false;
    }

    return NextResponse.json({
      persisted,
      ok: true,
      workerName,
      reference,
      // Note: the exact amount is intentionally NOT returned to clients; only
      // the range and the public commitment are public.
      range: { min: minUsdc, max: maxUsdc },
      proofId,
      onChain: {
        txHash,
        explorerUrl: `${EXPLORER_BASE}/tx/${txHash}`,
        verified: true,
      },
      publicSignals,
    });
  } catch (e) {
    console.error('payroll error', e);
    return NextResponse.json(
      { error: 'payment proof flow failed', detail: String(e) },
      { status: 500 },
    );
  }
}
