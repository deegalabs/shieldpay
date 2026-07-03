/**
 * Off-chain prover for the Income Credential (feature F1).
 *
 * Produces ONE Groth16 proof that a specific employer paid a worker, over N=6
 * months, amounts whose SUM lies in a claimed [rangeMin, rangeMax] range, without
 * revealing any single monthly amount. The circuit verifies an employer
 * EdDSA-Poseidon signature on every one of the N records, so the amounts are
 * employer-attested, not self-claimed.
 *
 * Public-signal order (frozen by the circuit): [0] nullifier, [1] employerAx,
 * [2] employerAy, [3] workerId, [4] rangeMin, [5] rangeMax, [6] verifierId.
 * Encode with the shared encodeProof / encodePublicSignals for the income
 * verifier contract.
 */
import path from 'node:path';
import { fieldToBe32 } from './encode';
import type { Groth16Proof } from './types';

const N = 6;
const ARTIFACTS_DIR = path.join(process.cwd(), 'circuits', 'income_credential', 'target');
const WASM_PATH = path.join(ARTIFACTS_DIR, 'income_credential_js', 'income_credential.wasm');
const ZKEY_PATH = path.join(ARTIFACTS_DIR, 'income_credential_final.zkey');

export interface IncomeRecord {
  /** Amount paid that month, in USDC cents. */
  amountCents: number;
  /** Month index, e.g. YYYYMM as a number (202601). */
  month: number;
  /** Employer EdDSA-Poseidon signature over Poseidon(amountCents, month, workerId). */
  sig: { R8: [string, string]; S: string };
}

export interface IncomeCredentialArgs {
  /** Employer-signed monthly records. Must be exactly N=6 (see note below). */
  records: IncomeRecord[];
  /** Employer public key coordinates, as field-element decimal strings. */
  employerAx: string;
  employerAy: string;
  /** Field-string binding the credential to the worker (workerIdFromAddress). */
  workerId: string;
  /** Claimed income range, in USDC cents. The true sum stays hidden. */
  rangeMinCents: number;
  rangeMaxCents: number;
  /** Verifier session id the nullifier is scoped to (field-string). */
  verifierId: string;
  /** Worker nullifier seed, known only to the worker (field-string). */
  secret: string;
}

export interface IncomeCredentialProof {
  proof: Groth16Proof;
  publicSignals: string[];
  /**
   * The presentation nullifier (public signal 0) as 32 big-endian bytes. This is
   * the on-chain replay key: the income verifier rejects a nullifier already
   * presented. It is deterministic per (secret, verifierId).
   */
  nullifier: Buffer;
}

/**
 * Prove the income statement over exactly N=6 employer-signed months.
 *
 * Note on padding: the circuit checks an employer signature on every one of the
 * N slots (EdDSA enabled=1 for all), so there is no valid zero padding a worker
 * can synthesize without the employer signing it. To present fewer real months,
 * the employer must sign zero-amount filler records and include them here. This
 * function therefore requires exactly N signed records and does not fabricate
 * padding it could not prove.
 */
export async function generateIncomeCredentialProof(
  args: IncomeCredentialArgs,
): Promise<IncomeCredentialProof> {
  if (args.records.length !== N) {
    throw new Error(
      `income credential requires exactly ${N} employer-signed records, got ${args.records.length}; ` +
        'every slot needs an employer signature, so pad with employer-signed zero-amount months',
    );
  }
  const snarkjs = await import('snarkjs');

  const amount: string[] = [];
  const month: string[] = [];
  const sigR8: [string, string][] = [];
  const sigS: string[] = [];

  for (const r of args.records) {
    amount.push(String(r.amountCents));
    month.push(String(r.month));
    sigR8.push([r.sig.R8[0], r.sig.R8[1]]);
    sigS.push(r.sig.S);
  }

  const input = {
    amount,
    month,
    sigR8,
    sigS,
    secret: args.secret,
    employerAx: args.employerAx,
    employerAy: args.employerAy,
    workerId: args.workerId,
    rangeMin: String(args.rangeMinCents),
    rangeMax: String(args.rangeMaxCents),
    verifierId: args.verifierId,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);
  const nullifierSignal = publicSignals[0];
  if (nullifierSignal === undefined) throw new Error('income proof produced no nullifier signal');
  return {
    proof: proof as Groth16Proof,
    publicSignals,
    nullifier: fieldToBe32(nullifierSignal),
  };
}
