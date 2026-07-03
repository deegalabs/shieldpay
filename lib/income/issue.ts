import { createHash, randomBytes } from 'node:crypto';
import {
  getCompanyById,
  ensureCompanyViewingKey,
  ensureCompanyEmployerSeed,
  listPaymentsForWorker,
  type PaymentRow,
} from '@/lib/db/client';
import { openWitness } from '@/lib/zk/disclosure';
import { employerKeyForCompany, signRecord, workerIdFromAddress } from '@/lib/zk/income-signer';
import { generateIncomeCredentialProof, type IncomeRecord } from '@/lib/zk/income';
import { encodeProof, encodePublicSignals, bytesToField } from '@/lib/zk/encode';
import { recordCredentialOnChain } from '@/lib/stellar/soroban';
import { ServerSigner } from '@/lib/stellar/signer';
import { monthFromReference } from '@/lib/payments/reference';
import { COMPANY } from '@/lib/constants';

/** The income circuit proves exactly N=6 employer-signed monthly records. */
export const INCOME_RECORDS = 6;

/**
 * Coded failure cases for issuance. Callers map these to HTTP status codes and
 * user-facing messages. The codes never carry an amount, key, secret, or
 * randomness, so they are safe to surface.
 */
export type IncomeIssueCode =
  | 'issuer_not_configured'
  | 'company_not_found'
  | 'db_unavailable'
  | 'insufficient_payments'
  | 'unseal_failed'
  | 'total_outside_range';

export class IncomeIssueError extends Error {
  constructor(public readonly code: IncomeIssueCode) {
    super(code);
    this.name = 'IncomeIssueError';
  }
}

export interface IssueInput {
  companyId: string;
  workerAddress: string;
  rangeMinCents: number;
  rangeMaxCents: number;
  verifierLabel: string;
}

/**
 * The issuance return payload. Carries the on-chain credential facts plus the
 * period-agnostic identity fields a statement or receipt needs (payer name and
 * tax id, recipient name). It never carries any monthly amount, the employer
 * private key, the nullifier secret, or any randomness.
 */
export interface IssueResult {
  credentialId: string;
  nullifier: string;
  employerAx: string;
  employerAy: string;
  rangeMinCents: number;
  rangeMaxCents: number;
  verifierLabel: string;
  txHash: string;
  workerName: string;
  companyName: string;
  companyCnpj: string;
}

/**
 * Issue a proof of income for a recipient (feature F1 core, shared by the
 * issuance route and the income-statement route).
 *
 * The company attests, in zero knowledge, that it paid this worker a sum within
 * the claimed range over the last six recorded payments, revealing no monthly
 * amount. The proof is verified and recorded on-chain by the income verifier
 * under a fresh nullifier, so that exact credential cannot be re-recorded. This
 * function never returns any amount, the employer key, the nullifier secret, or
 * any randomness, and throws IncomeIssueError with a stable code for every
 * expected failure so callers can map it to a status without leaking a figure.
 */
export async function issueIncomeCredential(input: IssueInput): Promise<IssueResult> {
  const { companyId, workerAddress, rangeMinCents, rangeMaxCents, verifierLabel } = input;

  const companySecret = process.env.COMPANY_SECRET_KEY;
  if (!companySecret) throw new IncomeIssueError('issuer_not_configured');

  const company = await getCompanyById(companyId);
  if (!company) throw new IncomeIssueError('company_not_found');

  // Most recent N payments to this worker, made by THIS company only.
  let history: PaymentRow[];
  try {
    history = await listPaymentsForWorker(workerAddress);
  } catch {
    throw new IncomeIssueError('db_unavailable');
  }
  const recent = history.filter((p) => p.company_id === company.id).slice(0, INCOME_RECORDS);
  if (recent.length < INCOME_RECORDS) {
    throw new IncomeIssueError('insufficient_payments');
  }
  const workerName = recent[0]!.worker_name;

  // Unseal each amount with the company viewing key (the same server-held key
  // the auditor export uses). The viewing key's only job here is unsealing
  // amounts; it is never used to derive the employer key.
  const viewingKey = await ensureCompanyViewingKey(company.id);
  // Derive the employer attestation key from a DEDICATED per-company seed,
  // independent of the viewing key (R6-M1): a viewing-key compromise must not be
  // able to forge income attestations, and the two secrets rotate independently.
  // Consequence: because this seed is new and independent, the employer public
  // key (ax, ay) for a company changes from the previous viewing-key-derived one,
  // so any income credential issued before this change no longer matches. That is
  // acceptable pre-production (testnet; credentials are re-issued on demand).
  const employer = await employerKeyForCompany(await ensureCompanyEmployerSeed(company.id));
  const workerId = workerIdFromAddress(workerAddress);

  const records: IncomeRecord[] = [];
  let sumCents = 0;
  for (const p of recent) {
    const witness = p.disclosure ? openWitness(viewingKey, p.disclosure) : null;
    if (!witness) throw new IncomeIssueError('unseal_failed');
    const month = monthFromReference(p.reference);
    const sig = await signRecord(employer.privHex, {
      amountCents: witness.amountCents,
      month,
      workerId,
    });
    records.push({ amountCents: witness.amountCents, month, sig });
    sumCents += witness.amountCents;
  }

  // The claimed range must bracket the true six-month total (the circuit would
  // reject it otherwise). Check here for a clean error that leaks no figure.
  if (sumCents < rangeMinCents || sumCents > rangeMaxCents) {
    throw new IncomeIssueError('total_outside_range');
  }

  // The verifier label scopes the nullifier; a fresh secret keeps each issuance
  // unique so it can be presented once on-chain.
  const verifierId = bytesToField(createHash('sha256').update(verifierLabel).digest());
  const secret = BigInt('0x' + randomBytes(31).toString('hex')).toString();

  const generated = await generateIncomeCredentialProof({
    records,
    employerAx: employer.ax,
    employerAy: employer.ay,
    workerId,
    rangeMinCents,
    rangeMaxCents,
    verifierId,
    secret,
  });

  const { credentialId, txHash } = await recordCredentialOnChain({
    signer: new ServerSigner(companySecret),
    nullifier: generated.nullifier,
    proofBytes: encodeProof(generated.proof),
    publicSignalsBytes: encodePublicSignals(generated.publicSignals),
  });

  return {
    credentialId,
    nullifier: generated.nullifier.toString('hex'),
    employerAx: employer.ax,
    employerAy: employer.ay,
    rangeMinCents,
    rangeMaxCents,
    verifierLabel,
    txHash,
    workerName,
    companyName: company.name,
    companyCnpj: company.cnpj || COMPANY.cnpj,
  };
}
