// Validate the Proof-of-Payroll circuit end-to-end: build a sample run (real
// payments + zero padding), prove the aggregate statement, and verify it.
//   node circuits/scripts/gen_payroll_testdata.mjs
import { buildPoseidon } from 'circomlibjs';
import * as snarkjs from 'snarkjs';
import fs from 'node:fs';
import path from 'node:path';

const TARGET = path.join(process.cwd(), 'circuits/payroll_proof/target');
const WASM = path.join(TARGET, 'payroll_proof_js/payroll_proof.wasm');
const ZKEY = path.join(TARGET, 'payroll_proof_final.zkey');
const VK = JSON.parse(fs.readFileSync(path.join(TARGET, 'payroll_verification_key.json')));

const N = 8;
const poseidon = await buildPoseidon();
const commit = (value, r) => poseidon.F.toString(poseidon([value, r]));

// Three real payments; the rest is zero padding (value 0 in range [0,0]).
const real = [
  { value: 50000, min: 45000, max: 55000 },
  { value: 75000, min: 70000, max: 80000 },
  { value: 35000, min: 30000, max: 40000 },
];

const value = [];
const randomness = [];
const commitment = [];
const minValue = [];
const maxValue = [];
let total = 0n;

for (let i = 0; i < N; i++) {
  const p = real[i] ?? { value: 0, min: 0, max: 0 };
  const r = (BigInt(1000 + i) * 7919n).toString();
  value.push(p.value);
  randomness.push(r);
  commitment.push(commit(p.value, r));
  minValue.push(p.min);
  maxValue.push(p.max);
  total += BigInt(p.value);
}

const input = { value, randomness, commitment, minValue, maxValue, total: total.toString() };

console.log('proving aggregate over', real.length, 'real payments, total =', total.toString());
const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);
console.log('public signals count:', publicSignals.length, '(expected 25: commitment[8]+min[8]+max[8]+total)');
console.log('last public signal (total):', publicSignals[publicSignals.length - 1]);

const ok = await snarkjs.groth16.verify(VK, publicSignals, proof);
console.log(ok ? 'VERIFY: OK ✓' : 'VERIFY: FAILED ✗');

// Negative test: tamper the public total, verification must fail.
const bad = [...publicSignals];
bad[bad.length - 1] = (total + 1n).toString();
const okBad = await snarkjs.groth16.verify(VK, bad, proof);
console.log(okBad ? 'TAMPER: unexpectedly verified ✗' : 'TAMPER: correctly rejected ✓');

fs.writeFileSync(path.join(TARGET, 'proof.json'), JSON.stringify(proof));
fs.writeFileSync(path.join(TARGET, 'public.json'), JSON.stringify(publicSignals));
process.exit(ok && !okBad ? 0 : 1);
