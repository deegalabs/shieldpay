/**
 * Generate a Groth16 proof for a single payment (CLI / test harness).
 *
 * Usage:
 *   npm run zk:prove -- --value 50000 --min 45000 --max 55000
 *
 * Computes the Poseidon commitment with circomlibjs, builds the witness,
 * proves with snarkjs, and verifies locally as a sanity check.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildPoseidon } from 'circomlibjs';
// @ts-expect-error - snarkjs ships no types
import * as snarkjs from 'snarkjs';

const TARGET = path.join(__dirname, '..', 'payment_proof', 'target');
const WASM = path.join(TARGET, 'payment_proof_js', 'payment_proof.wasm');
const ZKEY = path.join(TARGET, 'payment_proof_final.zkey');
const VKEY = path.join(TARGET, 'verification_key.json');

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}

async function main() {
  const value = arg('value', 50000);
  const minValue = arg('min', 45000);
  const maxValue = arg('max', 55000);
  const valueRandomness = arg('rand', 123456789);

  const poseidon = await buildPoseidon();
  const commitment = poseidon.F.toString(poseidon([value, valueRandomness]));

  const input = {
    value,
    valueRandomness,
    valueCommitment: commitment,
    minValue,
    maxValue,
  };

  console.log('Witness:', input);

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);
  const vKey = JSON.parse(readFileSync(VKEY, 'utf8'));
  const ok = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  console.log('Public signals:', publicSignals);
  console.log('Local verification:', ok ? 'VALID ✅' : 'INVALID ❌');
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
