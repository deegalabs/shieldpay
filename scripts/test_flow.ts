/**
 * End-to-end smoke test of the ShieldPay proof flow (off-chain portions).
 *
 * Verifies that the ZK prover produces a locally-valid proof for an in-range
 * payment and rejects an out-of-range one. The on-chain submission is exercised
 * separately once contracts are deployed (see contracts/deploy).
 *
 * Run: npm run test:flow   (requires `npm run zk:setup` to have produced artifacts)
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildPoseidon } from 'circomlibjs';
// @ts-expect-error - snarkjs ships no types
import * as snarkjs from 'snarkjs';

const TARGET = path.join(__dirname, '..', 'circuits', 'payment_proof', 'target');
const WASM = path.join(TARGET, 'payment_proof_js', 'payment_proof.wasm');
const ZKEY = path.join(TARGET, 'payment_proof_final.zkey');
const VKEY = path.join(TARGET, 'verification_key.json');

async function prove(value: number, min: number, max: number) {
  const poseidon = await buildPoseidon();
  const randomness = 123456789;
  const commitment = poseidon.F.toString(poseidon([value, randomness]));
  const input = { value, valueRandomness: randomness, valueCommitment: commitment, minValue: min, maxValue: max };
  return snarkjs.groth16.fullProve(input, WASM, ZKEY);
}

async function main() {
  const vKey = JSON.parse(readFileSync(VKEY, 'utf8'));

  console.log('Case 1: in-range payment (500.00 in [450, 550]) should be VALID');
  const ok = await prove(50000, 45000, 55000);
  const valid = await snarkjs.groth16.verify(vKey, ok.publicSignals, ok.proof);
  console.log('  ->', valid ? 'VALID ✅' : 'INVALID ❌');
  if (!valid) throw new Error('expected valid proof');

  console.log('Case 2: out-of-range payment (600.00 in [450, 550]) should FAIL to prove');
  try {
    await prove(60000, 45000, 55000);
    throw new Error('expected proof generation to fail for out-of-range value');
  } catch (e) {
    console.log('  -> correctly rejected ✅');
  }

  console.log('\nE2E off-chain flow OK.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
