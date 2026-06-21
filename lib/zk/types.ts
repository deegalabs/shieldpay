/**
 * Types for the ShieldPay zero-knowledge layer.
 *
 * The circuit proves, in zero knowledge, that a payment amount falls within
 * the contractual [min, max] range WITHOUT revealing the exact amount.
 * Proof system: Groth16 (zk-SNARK) over the Circom toolchain — the path that
 * actually fits the Soroban verification budget on testnet today.
 */

/** Private inputs (witness) — never leave the prover. */
export interface PaymentWitness {
  /** Real payment amount, in USDC cents (e.g. $500.00 -> 50000). */
  value: number;
  /** Randomness for the value commitment (decimal string of a field element). */
  valueRandomness: string;
}

/** Public inputs — visible on-chain, fed to the verifier. */
export interface PaymentPublicInputs {
  /** Poseidon commitment of the value (hides the exact amount). */
  valueCommitment: string;
  /** Lower bound of the contractual range, in USDC cents. */
  minValue: number;
  /** Upper bound of the contractual range, in USDC cents. */
  maxValue: number;
  /** Field element binding the proof to the recipient (< BN254 scalar field). */
  workerAddressHash: string;
  /** Field element binding the proof to the settlement tx (< BN254 scalar field). */
  paymentTxHash: string;
}

/** Full circuit input passed to snarkjs. */
export type CircuitInput = PaymentWitness & PaymentPublicInputs;

/** A generated Groth16 proof plus its public signals. */
export interface PaymentProof {
  proof: Groth16Proof;
  publicSignals: string[];
}

/** snarkjs Groth16 proof shape. */
export interface Groth16Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: 'groth16';
  curve: string;
}
