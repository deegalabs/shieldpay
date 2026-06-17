import { randomBytes, createHash } from 'node:crypto';
import { generatePaymentProof } from '@/lib/zk/prover';
import { poseidonCommitment, randomFieldElement } from '@/lib/zk/commitment';
import { encodeProof, encodePublicSignals, fieldToBe32 } from '@/lib/zk/encode';
import { recordProofOnChain } from '@/lib/stellar/soroban';
import { settlePaymentRecord } from '@/lib/stellar/transactions';
import { insertPayment, type CompanyRow, type PaymentRow } from '@/lib/db/client';
import { sealWitness } from '@/lib/zk/disclosure';
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
  settlementTxHash: string | null;
  payment: PaymentRow;
}

/**
 * The core "Pay & Prove" unit, reused by single payments and payroll runs:
 * commit to the amount → Groth16 range proof → verify+record on-chain → persist.
 * The exact amount is never stored in the clear — only the commitment + the
 * public range. When a `viewingKey` is supplied, the witness {amount, randomness}
 * is additionally sealed under it (N4) so an authorized auditor can later reveal
 * and re-verify the amount against the on-chain commitment.
 */
export async function proveAndRecordPayment(args: {
  companySecret: string;
  company: CompanyRow | null;
  input: PaymentInput;
  runId?: string | null;
  viewingKey?: string | null;
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

  // N5: settle first (best-effort, recipient-visible, amount-confidential), then
  // bind the proof to the REAL settlement tx hash. If settlement is skipped, fall
  // back to a random binding id so the proof is still recorded.
  const settlement = await settlePaymentRecord({
    companySecret: args.companySecret,
    workerAddress: input.workerAddress,
    reference: input.reference,
  });
  const paymentTxHash = settlement
    ? Buffer.from(settlement.hash, 'hex')
    : randomBytes(32);

  const { proofId, txHash } = await recordProofOnChain({
    companySecret: args.companySecret,
    workerAddressHash: createHash('sha256').update(input.workerAddress).digest(),
    paymentTxHash,
    valueCommitment: fieldToBe32(commitment),
    proofBytes: encodeProof(proof),
    publicSignalsBytes: encodePublicSignals(publicSignals),
  });

  const disclosure = args.viewingKey
    ? sealWitness(args.viewingKey, { amountCents: value, randomness })
    : null;

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
    disclosure,
    settlement_tx_hash: settlement?.hash ?? null,
    settlement_asset: settlement?.asset ?? null,
  });

  return { amountCents: value, proofId, txHash, settlementTxHash: settlement?.hash ?? null, payment };
}
