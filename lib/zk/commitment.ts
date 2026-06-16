/**
 * Poseidon value commitment: commitment = Poseidon(value, randomness).
 * Hides the exact amount while binding it to the public commitment the circuit
 * checks. Uses circomlibjs (must match the circom Poseidon in the circuit).
 */
import { randomBytes } from 'node:crypto';

/** A random field element (decimal string) usable as commitment randomness. */
export function randomFieldElement(): string {
  // 248 bits stays safely below the BN254 scalar field modulus.
  return BigInt('0x' + randomBytes(31).toString('hex')).toString();
}

/** Compute Poseidon(value, randomness) as a decimal string. */
export async function poseidonCommitment(
  value: number | bigint,
  randomness: string,
): Promise<string> {
  const { buildPoseidon } = await import('circomlibjs');
  const poseidon = await buildPoseidon();
  return poseidon.F.toString(poseidon([value, randomness]));
}
