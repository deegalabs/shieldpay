// CI gate: prove that the ZK stack is real on every push.
// For both circuits (per-payment and aggregate payroll), build a valid witness
// input, generate a Groth16 proof, verify it (must pass), then tamper a public
// signal and verify again (must fail). No network, no chain, no keys, no DB.
//   node circuits/scripts/ci_prove_verify.mjs
import { buildPoseidon } from 'circomlibjs';
import * as snarkjs from 'snarkjs';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const poseidon = await buildPoseidon();
const commit = (value, r) => poseidon.F.toString(poseidon([value, r]));

// Per-payment circuit: one value in range with a Poseidon commitment.
async function checkPaymentProof() {
  const TARGET = path.join(ROOT, 'circuits/payment_proof/target');
  const WASM = path.join(TARGET, 'payment_proof_js/payment_proof.wasm');
  const ZKEY = path.join(TARGET, 'payment_proof_final.zkey');
  const VK = JSON.parse(fs.readFileSync(path.join(TARGET, 'verification_key.json')));

  const value = 50000;
  const valueRandomness = '123456789';
  const valueCommitment = commit(value, valueRandomness);
  const workerAddressHash = BigInt('0x' + '02'.repeat(32)).toString();
  const paymentTxHash = BigInt('0x' + '03'.repeat(32)).toString();

  const input = {
    value,
    valueRandomness,
    valueCommitment,
    minValue: 45000,
    maxValue: 55000,
    workerAddressHash,
    paymentTxHash,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);

  const ok = await snarkjs.groth16.verify(VK, publicSignals, proof);
  if (!ok) {
    throw new Error('payment_proof: valid proof did NOT verify');
  }

  // Tamper: flip the first public signal, verification must fail.
  const bad = [...publicSignals];
  bad[0] = (BigInt(bad[0]) + 1n).toString();
  const okBad = await snarkjs.groth16.verify(VK, bad, proof);
  if (okBad) {
    throw new Error('payment_proof: tampered proof still verified');
  }

  console.log('PASS payment_proof: valid proof verifies, tampered proof rejected');
}

// Aggregate payroll circuit: a few real lines padded to N=8 with zeros.
async function checkPayrollProof() {
  const TARGET = path.join(ROOT, 'circuits/payroll_proof/target');
  const WASM = path.join(TARGET, 'payroll_proof_js/payroll_proof.wasm');
  const ZKEY = path.join(TARGET, 'payroll_proof_final.zkey');
  const VK = JSON.parse(fs.readFileSync(path.join(TARGET, 'payroll_verification_key.json')));

  const N = 8;
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

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);

  const ok = await snarkjs.groth16.verify(VK, publicSignals, proof);
  if (!ok) {
    throw new Error('payroll_proof: valid proof did NOT verify');
  }

  // Tamper: bump the public total (last signal), verification must fail.
  const bad = [...publicSignals];
  const last = bad.length - 1;
  bad[last] = (BigInt(bad[last]) + 1n).toString();
  const okBad = await snarkjs.groth16.verify(VK, bad, proof);
  if (okBad) {
    throw new Error('payroll_proof: tampered proof still verified');
  }

  console.log('PASS payroll_proof: valid proof verifies, tampered proof rejected');
}

try {
  await checkPaymentProof();
  await checkPayrollProof();
  console.log('ZK CI: both circuits passed (real proofs verify, tampered proofs rejected)');
  process.exit(0);
} catch (err) {
  console.error('ZK CI FAILED:', err.message);
  process.exit(1);
}
