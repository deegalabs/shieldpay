import { randomBytes, createHash } from 'node:crypto';
import { generatePaymentProof } from '@/lib/zk/prover';
import { poseidonCommitment, randomFieldElement } from '@/lib/zk/commitment';
import { encodeProof, encodePublicSignals, fieldToBe32 } from '@/lib/zk/encode';
import { recordProofOnChain } from '@/lib/stellar/soroban';
import { insertPayment, type CompanyRow, type PaymentRow } from '@/lib/db/client';
import { COMPANY } from '@/lib/constants';

export interface PaymentInput {
  workerName: string;
  workerAddress: string;
  amountUsdc: number;
  minUsdc: number;
  maxUsdc: number;
  reference: string;
}

export interface PaymentResult {
  amountCents: number;
  proofId: string;
  txHash: string;
  payment: PaymentRow;
}

/**
 * The core "Pay & Prove" unit, reused by single payments and payroll runs:
 * commit to the amount → Groth16 range proof → verify+record on-chain → persist.
 * The exact amount is never stored — only the commitment + the public range.
 */
export async function proveAndRecordPayment(args: {
  companySecret: string;
  company: CompanyRow | null;
  input: PaymentInput;
  runId?: string | null;
}): Promise<PaymentResult> {
  const { input } = args;
  const value = Math.round(input.amountUsdc * 100);
  const minValue = Math.round(input.minUsdc * 100);
  const maxValue = Math.round(input.maxUsdc * 100);
  if (value < minValue || value > maxValue) {
    throw new Error(`amount ${input.amountUsdc} is outside the range [${input.minUsdc}, ${input.maxUsdc}]`);
  }

  const randomness = randomFieldElement();
  const commitment = await poseidonCommitment(value, randomness);
  const { proof, publicSignals } = await generatePaymentProof({
    value,
    valueRandomness: randomness,
    valueCommitment: commitment,
    minValue,
    maxValue,
  });

  const { proofId, txHash } = await recordProofOnChain({
    companySecret: args.companySecret,
    workerAddressHash: createHash('sha256').update(input.workerAddress).digest(),
    paymentTxHash: randomBytes(32),
    valueCommitment: fieldToBe32(commitment),
    proofBytes: encodeProof(proof),
    publicSignalsBytes: encodePublicSignals(publicSignals),
  });

  const payment = await insertPayment({
    worker_name: input.workerName,
    worker_address: input.workerAddress,
    reference: input.reference,
    range_min: minValue,
    range_max: maxValue,
    value_commitment: commitment,
    proof_id: proofId,
    tx_hash: txHash,
    verified: true,
    company_id: args.company?.id ?? null,
    payer_name: args.company?.name ?? COMPANY.name,
    payer_cnpj: args.company?.cnpj ?? COMPANY.cnpj,
    run_id: args.runId ?? null,
  });

  return { amountCents: value, proofId, txHash, payment };
}
