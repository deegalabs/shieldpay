// Validate the Income Credential circuit end-to-end: an employer signs six
// monthly pay records for a worker, the worker proves the sum is in a claimed
// range without revealing any amount, then a tampered proof is rejected.
//   node circuits/scripts/gen_income_testdata.mjs
import { buildEddsa, buildPoseidon } from 'circomlibjs';
import * as snarkjs from 'snarkjs';
import fs from 'node:fs';
import path from 'node:path';

const TARGET = path.join(process.cwd(), 'circuits/income_credential/target');
const WASM = path.join(TARGET, 'income_credential_js/income_credential.wasm');
const ZKEY = path.join(TARGET, 'income_credential_final.zkey');
const VK = JSON.parse(fs.readFileSync(path.join(TARGET, 'income_verification_key.json')));

const N = 6;
const eddsa = await buildEddsa();
const poseidon = await buildPoseidon();

// Employer keypair (BabyJubJub public key is what the credential is verified
// against). In production the private key lives with the payer, never here.
const employerPrv = Buffer.from(
  '0001020304050607080900010203040506070809000102030405060708090001',
  'hex',
);
const employerPub = eddsa.prv2pub(employerPrv);
const employerAx = eddsa.F.toString(employerPub[0]);
const employerAy = eddsa.F.toString(employerPub[1]);

// The field that binds the credential to this worker (same style of id the
// payment circuit uses). The verifier session id and the worker's nullifier
// secret complete the public statement.
const workerId = '881122334455';
const verifierId = '20260703';
const secret = '424242424242424242';

// Six monthly amounts in USDC cents. Sum = 302100 cents ($30,210).
const amounts = [480000, 500000, 520000, 500000, 510000, 512100];
const months = [202601, 202602, 202603, 202604, 202605, 202606];

// The msg the employer signs per record: Poseidon(amount, month, workerId).
const signRecord = (amount, month) => {
  const msgF = poseidon([amount, month, workerId]);
  const M = eddsa.F.e(poseidon.F.toString(msgF));
  const sig = eddsa.signPoseidon(employerPrv, M);
  if (!eddsa.verifyPoseidon(M, sig, employerPub)) {
    throw new Error('off-chain signature failed to verify; check field handling');
  }
  return {
    R8: [eddsa.F.toString(sig.R8[0]), eddsa.F.toString(sig.R8[1])],
    S: sig.S.toString(),
  };
};

const amount = [];
const month = [];
const sigR8 = [];
const sigS = [];
let sum = 0n;

for (let i = 0; i < N; i++) {
  const sig = signRecord(amounts[i], months[i]);
  amount.push(amounts[i].toString());
  month.push(months[i].toString());
  sigR8.push(sig.R8);
  sigS.push(sig.S);
  sum += BigInt(amounts[i]);
}

// Claimed range that contains the true sum without revealing it exactly.
const rangeMin = '3000000'; // true sum 3022100 sits inside [3000000, 3100000]
const rangeMax = '3100000';

const input = {
  amount,
  month,
  sigR8,
  sigS,
  secret,
  employerAx,
  employerAy,
  workerId,
  rangeMin,
  rangeMax,
  verifierId,
};

console.log('proving income over', N, 'signed months, true sum =', sum.toString(),
  'cents, claimed range = [' + rangeMin + ',', rangeMax + ']');
const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);
console.log('public signals count:', publicSignals.length,
  '(expected 7: nullifier, employerAx, employerAy, workerId, rangeMin, rangeMax, verifierId)');
console.log('public signal order:');
const labels = ['nullifier', 'employerAx', 'employerAy', 'workerId', 'rangeMin', 'rangeMax', 'verifierId'];
publicSignals.forEach((s, i) => console.log('  [' + i + ']', labels[i], '=', s));

const ok = await snarkjs.groth16.verify(VK, publicSignals, proof);
console.log(ok ? 'VERIFY: OK' : 'VERIFY: FAILED');

// Negative test: forge a signature (tamper the first record's S scalar). The
// employer never signed this, so the in-circuit EdDSA check must make proof
// generation fail. Catch that and treat it as the expected rejection.
let tamperRejected = false;
try {
  const forged = { ...input, sigS: [...sigS] };
  forged.sigS[0] = (BigInt(sigS[0]) + 1n).toString();
  await snarkjs.groth16.fullProve(forged, WASM, ZKEY);
  // If it somehow produced a witness, verification below would still catch it,
  // but a valid EdDSA constraint should have already thrown.
  console.log('TAMPER: unexpectedly produced a proof');
} catch (e) {
  tamperRejected = true;
  console.log('TAMPER: correctly rejected (in-circuit EdDSA check failed)');
}

fs.writeFileSync(path.join(TARGET, 'proof.json'), JSON.stringify(proof));
fs.writeFileSync(path.join(TARGET, 'public.json'), JSON.stringify(publicSignals));

if (ok && tamperRejected) {
  console.log('PASS');
  process.exit(0);
}
console.log('FAIL');
process.exit(1);
