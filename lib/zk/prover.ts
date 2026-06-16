import path from 'node:path';
import { CircuitInput, PaymentProof } from './types';

/**
 * Off-chain Groth16 prover.
 *
 * Runs entirely in Node via snarkjs (pure JS/WASM) — no native binaries —
 * which is exactly why this deploys cleanly on Railway. At runtime we only
 * need the compiled circuit artifacts committed to the repo:
 *   - payment_proof_js/payment_proof.wasm  (witness generator)
 *   - payment_proof_final.zkey             (proving key)
 *   - verification_key.json                (for local sanity checks)
 *
 * Generate these once via `npm run zk:setup` (see circuits/scripts/setup.sh).
 */

const ARTIFACTS_DIR = path.join(process.cwd(), 'circuits', 'payment_proof', 'target');
const WASM_PATH = path.join(ARTIFACTS_DIR, 'payment_proof_js', 'payment_proof.wasm');
const ZKEY_PATH = path.join(ARTIFACTS_DIR, 'payment_proof_final.zkey');

/**
 * Generate a Groth16 proof that `value` is within [minValue, maxValue]
 * and matches the public commitment — without revealing `value`.
 */
export async function generatePaymentProof(
  input: CircuitInput,
): Promise<PaymentProof> {
  // Imported lazily so the browser bundle never tries to load snarkjs.
  const snarkjs = await import('snarkjs');

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    WASM_PATH,
    ZKEY_PATH,
  );

  return { proof: proof as PaymentProof['proof'], publicSignals };
}

/**
 * Verify a proof locally (off-chain sanity check). The authoritative
 * verification happens on-chain in the PaymentVerifier Soroban contract.
 */
export async function verifyPaymentProofLocally(
  verificationKey: object,
  proof: PaymentProof,
): Promise<boolean> {
  const snarkjs = await import('snarkjs');
  return snarkjs.groth16.verify(
    verificationKey,
    proof.publicSignals,
    proof.proof,
  );
}
