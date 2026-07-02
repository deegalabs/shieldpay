import path from 'node:path';
import { poseidonCommitment, randomFieldElement } from './commitment';
import type { Groth16Proof } from './types';

/**
 * Off-chain prover for the aggregate Proof-of-Payroll.
 *
 * Produces ONE Groth16 proof over a whole run that attests: every payment's
 * committed amount is within its agreed range, and the sum of all amounts equals
 * a public total, revealing no individual amount. Runs shorter than N pad with
 * zero entries (value 0 in range [0,0]); padding adds 0 to the total.
 *
 * The public signals are, in order: commitment[0..N-1], minValue[0..N-1],
 * maxValue[0..N-1], total. Encode with the shared encodeProof/encodePublicSignals.
 */
const N = 8;
const ARTIFACTS_DIR = path.join(process.cwd(), 'circuits', 'payroll_proof', 'target');
const WASM_PATH = path.join(ARTIFACTS_DIR, 'payroll_proof_js', 'payroll_proof.wasm');
const ZKEY_PATH = path.join(ARTIFACTS_DIR, 'payroll_proof_final.zkey');

export interface PayrollLineWitness {
  /** Amount in USDC cents. */
  value: number;
  /** Poseidon randomness used for this payment's commitment (decimal string). */
  randomness: string;
  /** The recorded commitment = Poseidon(value, randomness) (decimal string). */
  commitment: string;
  /** Agreed range in USDC cents. */
  minValue: number;
  maxValue: number;
}

export interface PayrollProof {
  proof: Groth16Proof;
  publicSignals: string[];
  /** The public total in USDC cents (sum of all line values). */
  totalCents: number;
}

/**
 * Prove the aggregate statement for a run of up to N payments. The caller passes
 * the same commitments and randomness already produced per payment, so the
 * aggregate proof is bound to the exact commitments recorded on-chain.
 */
export async function generatePayrollProof(lines: PayrollLineWitness[]): Promise<PayrollProof> {
  if (lines.length === 0 || lines.length > N) {
    throw new Error(`payroll proof supports 1..${N} payments, got ${lines.length}`);
  }
  const snarkjs = await import('snarkjs');

  const value: string[] = [];
  const randomness: string[] = [];
  const commitment: string[] = [];
  const minValue: string[] = [];
  const maxValue: string[] = [];
  let totalCents = 0;

  for (const l of lines) {
    value.push(String(l.value));
    randomness.push(l.randomness);
    commitment.push(l.commitment);
    minValue.push(String(l.minValue));
    maxValue.push(String(l.maxValue));
    totalCents += l.value;
  }

  // Pad to N with zero entries: value 0 in range [0,0], real Poseidon commitment.
  for (let i = lines.length; i < N; i++) {
    const r = randomFieldElement();
    value.push('0');
    randomness.push(r);
    commitment.push(await poseidonCommitment(0, r));
    minValue.push('0');
    maxValue.push('0');
  }

  const input = { value, randomness, commitment, minValue, maxValue, total: String(totalCents) };
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);
  return { proof: proof as Groth16Proof, publicSignals, totalCents };
}
