/**
 * Employer-side signing for the Income Credential (feature F1).
 *
 * The employer holds a BabyJubJub keypair. For each monthly pay record they sign
 * msg = Poseidon(amountCents, month, workerId) with EdDSA-Poseidon. Verifying
 * those signatures inside the circuit is what makes the amounts employer-attested
 * rather than self-claimed. Folding workerId into every record binds the
 * signatures to one worker, so a leaked (amount, month, signature) set cannot be
 * replayed under a different worker.
 *
 * This mirrors the exact circomlibjs usage in
 * circuits/scripts/gen_income_testdata.mjs (buildEddsa / buildPoseidon, the
 * Poseidon-then-F.e message encoding, and the R8/S field formatting).
 */
import { createHash, randomBytes } from 'node:crypto';
import { buildEddsa, buildPoseidon } from 'circomlibjs';
import { bytesToField } from './encode';

export interface EmployerKey {
  /**
   * BabyJubJub private key as 32 bytes hex. This is a secret: never log it, and
   * store it only where the payer controls it (never alongside credentials).
   */
  privHex: string;
  /** Employer public key X coordinate, as a BN254 field-element decimal string. */
  ax: string;
  /** Employer public key Y coordinate, as a BN254 field-element decimal string. */
  ay: string;
}

export interface EddsaSig {
  /** Signature R8 point, [x, y] as field-element decimal strings. */
  R8: [string, string];
  /** Signature S scalar, as a decimal string. */
  S: string;
}

export interface RecordToSign {
  /** Amount paid that month, in USDC cents. */
  amountCents: number;
  /** Month index, e.g. YYYYMM as a number (202601). */
  month: number;
  /** Field-string that binds the credential to the worker (see workerIdFromAddress). */
  workerId: string;
}

/**
 * The field-string workerId bound into every signed record and published as
 * public signal 3. Uses the same derivation the payment circuit uses,
 * field(sha256(workerAddress)), so a worker's id is consistent across circuits.
 * The circuit treats workerId as an opaque field element (the gen_income
 * fixture happens to use a plain number, but any field element is valid); this
 * derivation gives a stable, address-bound id.
 */
export function workerIdFromAddress(workerAddress: string): string {
  return bytesToField(createHash('sha256').update(workerAddress).digest());
}

/**
 * Generate a fresh employer BabyJubJub keypair. Returns the private key hex plus
 * the public Ax/Ay field strings the credential is verified against on-chain.
 */
export async function newEmployerKey(): Promise<EmployerKey> {
  const eddsa = await buildEddsa();
  const prv = randomBytes(32);
  const pub = eddsa.prv2pub(prv);
  return {
    privHex: prv.toString('hex'),
    ax: eddsa.F.toString(pub[0]),
    ay: eddsa.F.toString(pub[1]),
  };
}

/**
 * Sign one monthly pay record: EdDSA-Poseidon over Poseidon(amountCents, month,
 * workerId), matching what the circuit reconstructs and verifies. The signature
 * is re-verified here before returning, so a field-handling mistake fails loudly
 * at sign time rather than silently at prove time.
 */
export async function signRecord(employerPrivHex: string, record: RecordToSign): Promise<EddsaSig> {
  const eddsa = await buildEddsa();
  const poseidon = await buildPoseidon();
  const prv = Buffer.from(employerPrivHex, 'hex');
  if (prv.length !== 32) throw new Error('employer private key must be 32 bytes hex');
  const pub = eddsa.prv2pub(prv);

  const msgF = poseidon([record.amountCents, record.month, record.workerId]);
  const M = eddsa.F.e(poseidon.F.toString(msgF));
  const sig = eddsa.signPoseidon(prv, M);
  if (!eddsa.verifyPoseidon(M, sig, pub)) {
    throw new Error('income signature failed to verify; check field handling');
  }
  return {
    R8: [eddsa.F.toString(sig.R8[0]), eddsa.F.toString(sig.R8[1])],
    S: sig.S.toString(),
  };
}
