// Generate the proof + public signals used as the Soroban contract test vectors.
// Run from the repo root after `pnpm zk:setup`:
//   node circuits/scripts/gen_testdata.mjs
// Then encode each into hex (see the commands printed at the end).
import { buildPoseidon } from 'circomlibjs';
import * as snarkjs from 'snarkjs';
import fs from 'node:fs';
import path from 'node:path';

const TARGET = path.join(process.cwd(), 'circuits/payment_proof/target');
const WASM = path.join(TARGET, 'payment_proof_js/payment_proof.wasm');
const ZKEY = path.join(TARGET, 'payment_proof_final.zkey');

const poseidon = await buildPoseidon();
const value = 50000;
const valueRandomness = '123456789';
const valueCommitment = poseidon.F.toString(poseidon([value, valueRandomness]));

// Chosen so the recorded args in the test are the readable [2u8;32] / [3u8;32].
const workerAddressHash = BigInt('0x' + '02'.repeat(32)).toString();
const paymentTxHash = BigInt('0x' + '03'.repeat(32)).toString();

const input = { value, valueRandomness, valueCommitment, minValue: 45000, maxValue: 55000, workerAddressHash, paymentTxHash };
const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);

fs.writeFileSync(path.join(TARGET, 'proof.json'), JSON.stringify(proof));
fs.writeFileSync(path.join(TARGET, 'public.json'), JSON.stringify(publicSignals));

const be32 = (dec) => BigInt(dec).toString(16).padStart(64, '0');
const rustBytes = (hex) => '[' + hex.match(/../g).map((h) => '0x' + h).join(', ') + ']';

console.log('public signals:', publicSignals);
console.log('\ncommitment (signal 0) as Rust [u8; 32]:');
console.log(rustBytes(be32(publicSignals[0])));
console.log('\nNow encode the hex fixtures:');
console.log('  node circuits/scripts/encode_bn254_for_soroban.mjs vk     circuits/payment_proof/target/verification_key.json > contracts/payment_verifier/src/testdata/vk.hex');
console.log('  node circuits/scripts/encode_bn254_for_soroban.mjs proof  circuits/payment_proof/target/proof.json          > contracts/payment_verifier/src/testdata/proof.hex');
console.log('  node circuits/scripts/encode_bn254_for_soroban.mjs public circuits/payment_proof/target/public.json         > contracts/payment_verifier/src/testdata/public.hex');
process.exit(0);
