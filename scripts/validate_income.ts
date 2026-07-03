/**
 * End-to-end validator for the Income Credential (feature F1), using the real
 * lib code. An employer signs six monthly pay records for a worker, the worker
 * proves the sum is within a claimed range without revealing any amount, the
 * proof is verified locally with snarkjs, and (optionally) recorded on-chain.
 *
 *   pnpm tsx scripts/validate_income.ts
 *
 * The off-chain stages need no secrets and always run. The on-chain stage runs
 * only when a funded testnet secret is set:
 *
 *   DEMO_SECRET=$(stellar keys show deployer) pnpm tsx scripts/validate_income.ts
 *
 * DEMO_SECRET is preferred; COMPANY_SECRET_KEY is the fallback. The nullifier is
 * per (secret, verifierId), so a fresh secret each run avoids AlreadyPresented.
 */
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { newEmployerKey, signRecord, workerIdFromAddress } from '@/lib/zk/income-signer';
import { generateIncomeCredentialProof } from '@/lib/zk/income';
import { encodeProof, encodePublicSignals } from '@/lib/zk/encode';
import { CONTRACTS } from '@/lib/constants';

let failed = 0;
const pass = (s: string) => console.log(`  [PASS] ${s}`);
const skip = (s: string, why: string) => console.log(`  [SKIP] ${s}  (${why})`);
const fail = (s: string, e: unknown) => {
  failed++;
  console.log(`  [FAIL] ${s}\n         ${e instanceof Error ? e.message : e}`);
};

async function main() {
  console.log('Income Credential (F1) validation\n');

  // A fresh worker address and a fresh nullifier secret per run (so the on-chain
  // stage never collides with a prior presentation).
  const workerAddress = 'GWORKER' + randomBytes(20).toString('hex').toUpperCase();
  const workerId = workerIdFromAddress(workerAddress);
  const secret = BigInt('0x' + randomBytes(31).toString('hex')).toString();
  const verifierId = '20260703';

  // Six monthly amounts in USDC cents. True sum stays hidden; only the range is
  // published. Sum = 3022100 cents ($30,221) sits inside [3000000, 3100000].
  const amounts = [480000, 500000, 520000, 500000, 510000, 512100];
  const months = [202601, 202602, 202603, 202604, 202605, 202606];
  const rangeMinCents = 3000000;
  const rangeMaxCents = 3100000;
  const trueSum = amounts.reduce((a, b) => a + b, 0);

  console.log('Stage 1: employer key + record signing');
  const employer = await newEmployerKey();
  const records = [];
  try {
    for (let i = 0; i < 6; i++) {
      const amountCents = amounts[i]!;
      const month = months[i]!;
      const sig = await signRecord(employer.privHex, { amountCents, month, workerId });
      records.push({ amountCents, month, sig });
    }
    pass('employer signed 6 monthly records over Poseidon(amount, month, workerId)');
  } catch (e) {
    fail('employer signing', e);
    return finish();
  }

  console.log('\nStage 2: generate the income proof (off-chain)');
  let generated: Awaited<ReturnType<typeof generateIncomeCredentialProof>> | undefined;
  try {
    generated = await generateIncomeCredentialProof({
      records,
      employerAx: employer.ax,
      employerAy: employer.ay,
      workerId,
      rangeMinCents,
      rangeMaxCents,
      verifierId,
      secret,
    });
    console.log(
      `         true sum = ${trueSum} cents, claimed range = [${rangeMinCents}, ${rangeMaxCents}] (sum stays hidden)`,
    );
    console.log(`         public signals: ${generated.publicSignals.length} (expected 7)`);
    console.log(`         nullifier: ${generated.nullifier.toString('hex')}`);
    if (generated.publicSignals.length !== 7) throw new Error('expected 7 public signals');
    pass('proof generated with 7 public signals and a nullifier');
  } catch (e) {
    fail('proof generation', e);
    return finish();
  }

  console.log('\nStage 3: verify the proof locally (snarkjs)');
  try {
    const snarkjs = await import('snarkjs');
    const vkPath = path.join(
      process.cwd(),
      'circuits',
      'income_credential',
      'target',
      'income_verification_key.json',
    );
    const vk = JSON.parse(fs.readFileSync(vkPath, 'utf8'));
    const ok = await snarkjs.groth16.verify(vk, generated.publicSignals, generated.proof);
    if (!ok) throw new Error('snarkjs verify returned false');
    pass('proof verifies locally against the income verification key');
  } catch (e) {
    fail('local verification', e);
    return finish();
  }

  console.log('\nStage 4: record the credential on-chain (optional)');
  const onchainSecret = process.env.DEMO_SECRET ?? process.env.COMPANY_SECRET_KEY;
  if (!onchainSecret || !CONTRACTS.incomeVerifier) {
    skip(
      'verify + record on-chain',
      'set DEMO_SECRET (or COMPANY_SECRET_KEY) to a funded testnet secret',
    );
  } else {
    try {
      const { ServerSigner } = await import('@/lib/stellar/signer');
      const { recordCredentialOnChain } = await import('@/lib/stellar/soroban');
      const proofBytes = encodeProof(generated.proof);
      const publicSignalsBytes = encodePublicSignals(generated.publicSignals);
      const { credentialId, txHash } = await recordCredentialOnChain({
        signer: new ServerSigner(onchainSecret),
        nullifier: generated.nullifier,
        proofBytes,
        publicSignalsBytes,
      });
      console.log(`         credential id = ${credentialId}, tx = ${txHash}`);
      pass('credential verified and recorded on-chain by the income verifier');
    } catch (e) {
      fail('on-chain record', e);
    }
  }

  return finish();
}

function finish() {
  if (failed === 0) {
    console.log('\nPASS: income credential validated end-to-end.');
    process.exit(0);
  }
  console.log(`\nFAIL: ${failed} stage(s) failed.`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
