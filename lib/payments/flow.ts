import { randomBytes, createHash } from 'node:crypto';
import { generatePaymentProof } from '@/lib/zk/prover';
import { poseidonCommitment, randomFieldElement } from '@/lib/zk/commitment';
import { encodeProof, encodePublicSignals, fieldToBe32, bytesToField } from '@/lib/zk/encode';
import { recordProofOnChain } from '@/lib/stellar/soroban';
import { ServerSigner } from '@/lib/stellar/signer';
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

  // The company signs its own on-chain actions through this signer. Today it is
  // the server-held key; the non-custodial path swaps in a browser signer.
  const signer = new ServerSigner(args.companySecret);

  // Settle first (best-effort, recipient-visible, amount-confidential) so the
  // proof can be bound to the REAL settlement tx hash. If settlement is skipped,
  // fall back to a random binding id so the proof is still recorded.
  const settlement = await settlePaymentRecord({
    signer,
    workerAddress: input.workerAddress,
    reference: input.reference,
  });
  const paymentTxHash = settlement ? Buffer.from(settlement.hash, 'hex') : randomBytes(32);

  // Bind the proof to the recipient and the settlement tx, as field elements that
  // become public signals. The contract enforces that these match the recorded
  // values, so a valid proof cannot be reused for a different recipient or tx.
  const workerAddrField = bytesToField(createHash('sha256').update(input.workerAddress).digest());
  const txField = bytesToField(paymentTxHash);

  const { proof, publicSignals } = await generatePaymentProof({
    value,
    valueRandomness: randomness,
    valueCommitment: commitment,
    minValue,
    maxValue,
    workerAddressHash: workerAddrField,
    paymentTxHash: txField,
  });

  const { proofId, txHash } = await recordProofOnChain({
    signer,
    workerAddressHash: fieldToBe32(workerAddrField),
    paymentTxHash: fieldToBe32(txField),
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
