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
 * Pure proof preparation: commit to the amount and produce a Groth16 range
 * proof. No signer, no key, no database. This is the half of the flow that the
 * server always runs (it needs the circuit artifacts on disk), in BOTH the
 * custodial and the non-custodial path. Whoever holds the company key (server)
 * or wallet (browser) then signs the resulting on-chain call.
 *
 * `bindTo` is the 32 bytes the proof is bound to (ideally the settlement tx
 * hash). When absent, a random binding id is used, so the proof is still unique
 * and cannot be replayed for another payment.
 */
export interface PreparedProof {
  amountCents: number;
  commitment: string; // field element, persisted as value_commitment
  randomness: string; // field element, sealed under the viewing key (never on-chain)
  // 32-byte / serialized inputs for the on-chain verify_and_record call:
  workerAddressHash: Buffer;
  paymentTxHash: Buffer;
  valueCommitment: Buffer;
  proofBytes: Buffer;
  publicSignalsBytes: Buffer;
}

export async function prepareProof(args: {
  input: PaymentInput;
  bindTo?: Buffer | null;
}): Promise<PreparedProof> {
  const { input } = args;
  const value = Math.round(input.amountUsdc * 100);
  const minValue = Math.round(input.minUsdc * 100);
  const maxValue = Math.round(input.maxUsdc * 100);
  if (value < minValue || value > maxValue) {
    throw new Error(`amount ${input.amountUsdc} is outside the range [${input.minUsdc}, ${input.maxUsdc}]`);
  }

  const randomness = randomFieldElement();
  const commitment = await poseidonCommitment(value, randomness);

  const workerAddrField = bytesToField(createHash('sha256').update(input.workerAddress).digest());
  const txField = bytesToField(args.bindTo ?? randomBytes(32));

  const { proof, publicSignals } = await generatePaymentProof({
    value,
    valueRandomness: randomness,
    valueCommitment: commitment,
    minValue,
    maxValue,
    workerAddressHash: workerAddrField,
    paymentTxHash: txField,
  });

  return {
    amountCents: value,
    commitment,
    randomness,
    workerAddressHash: fieldToBe32(workerAddrField),
    paymentTxHash: fieldToBe32(txField),
    valueCommitment: fieldToBe32(commitment),
    proofBytes: encodeProof(proof),
    publicSignalsBytes: encodePublicSignals(publicSignals),
  };
}

/**
 * Persist a verified payment. The exact amount is never stored in the clear:
 * only the commitment and the public range. When a `viewingKey` is supplied the
 * witness {amount, randomness} is sealed under it (N4), so an authorized auditor
 * can later reveal and re-verify the amount against the on-chain commitment.
 *
 * Pass a pre-sealed `disclosure` (the non-custodial path seals during prepare
 * and round-trips the ciphertext), or a `viewingKey` to seal here (server path).
 */
export async function persistPayment(args: {
  input: PaymentInput;
  company: CompanyRow | null;
  runId?: string | null;
  amountCents: number;
  commitment: string;
  randomness?: string | null;
  viewingKey?: string | null;
  disclosure?: string | null;
  proofId: string;
  txHash: string;
  settlement: { hash: string; asset: string } | null;
}): Promise<PaymentRow> {
  const { input } = args;
  const disclosure =
    args.disclosure ??
    (args.viewingKey && args.randomness != null
      ? sealWitness(args.viewingKey, { amountCents: args.amountCents, randomness: args.randomness })
      : null);

  return insertPayment({
    worker_name: input.workerName,
    worker_address: input.workerAddress,
    reference: input.reference,
    range_min: Math.round(input.minUsdc * 100),
    range_max: Math.round(input.maxUsdc * 100),
    value_commitment: args.commitment,
    proof_id: args.proofId,
    tx_hash: args.txHash,
    verified: true,
    company_id: args.company?.id ?? null,
    payer_name: args.company?.name ?? COMPANY.name,
    payer_cnpj: args.company?.cnpj ?? COMPANY.cnpj,
    run_id: args.runId ?? null,
    disclosure,
    settlement_tx_hash: args.settlement?.hash ?? null,
    settlement_asset: args.settlement?.asset ?? null,
  });
}

/**
 * The custodial "Pay & Prove" unit (server holds the key), reused by the seed
 * script and `test_flow`, and the demo-safe fallback for payroll. Settle first
 * so the proof binds to the real settlement tx, then verify+record on-chain,
 * then persist. The non-custodial path composes prepareProof + persistPayment
 * around a browser signer instead (see /api/payroll/prepare + /record).
 */
export async function proveAndRecordPayment(args: {
  companySecret: string;
  company: CompanyRow | null;
  input: PaymentInput;
  runId?: string | null;
  viewingKey?: string | null;
}): Promise<PaymentResult> {
  const { input } = args;

  // The company signs its own on-chain actions through this signer.
  const signer = new ServerSigner(args.companySecret);

  // Settle first (best-effort, recipient-visible, amount-confidential) so the
  // proof can be bound to the REAL settlement tx hash.
  const settlement = await settlePaymentRecord({
    signer,
    workerAddress: input.workerAddress,
    reference: input.reference,
  });
  const bindTo = settlement ? Buffer.from(settlement.hash, 'hex') : null;

  const prep = await prepareProof({ input, bindTo });

  const { proofId, txHash } = await recordProofOnChain({
    signer,
    workerAddressHash: prep.workerAddressHash,
    paymentTxHash: prep.paymentTxHash,
    valueCommitment: prep.valueCommitment,
    proofBytes: prep.proofBytes,
    publicSignalsBytes: prep.publicSignalsBytes,
  });

  const payment = await persistPayment({
    input,
    company: args.company,
    runId: args.runId,
    amountCents: prep.amountCents,
    commitment: prep.commitment,
    randomness: prep.randomness,
    viewingKey: args.viewingKey,
    proofId,
    txHash,
    settlement,
  });

  return { amountCents: prep.amountCents, proofId, txHash, settlementTxHash: settlement?.hash ?? null, payment };
}
