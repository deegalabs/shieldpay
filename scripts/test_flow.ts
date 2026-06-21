/**
 * End-to-end validator for the ShieldPay proof chain, using the real lib code.
 *
 * Runs in stages. The off-chain stages need no secrets and always run. The
 * on-chain stages run only when the environment is configured, and assert the
 * result against the chain, so you can validate the whole pipeline from one
 * command instead of clicking through the web app.
 *
 *   pnpm test:flow
 *
 * Env that unlocks the on-chain stages:
 *   COMPANY_SECRET_KEY            funded testnet secret that signs on-chain
 *   PAYMENT_VERIFIER_CONTRACT_ID  deployed PaymentVerifier
 *   STELLAR_RPC_URL / NETWORK     default to testnet
 */
import { randomBytes, createHash } from 'node:crypto';
import { Keypair } from '@stellar/stellar-sdk';
import { generatePaymentProof } from '@/lib/zk/prover';
import { poseidonCommitment, randomFieldElement } from '@/lib/zk/commitment';
import { encodeProof, encodePublicSignals, fieldToBe32 } from '@/lib/zk/encode';
import { newViewingKey, sealWitness, openWitness } from '@/lib/zk/disclosure';
import { disclosePayments } from '@/lib/payments/disclose';
import type { PaymentRow } from '@/lib/db/client';
import { CONTRACTS } from '@/lib/constants';

let failed = 0;
const pass = (s: string) => console.log(`  [PASS] ${s}`);
const skip = (s: string, why: string) => console.log(`  [SKIP] ${s}  (${why})`);
const fail = (s: string, e: unknown) => {
  failed++;
  console.log(`  [FAIL] ${s}\n         ${e instanceof Error ? e.message : e}`);
};

async function makeProof(value: number, min: number, max: number) {
  const randomness = randomFieldElement();
  const commitment = await poseidonCommitment(value, randomness);
  const { proof, publicSignals } = await generatePaymentProof({
    value,
    valueRandomness: randomness,
    valueCommitment: commitment,
    minValue: min,
    maxValue: max,
  });
  return { randomness, commitment, proof, publicSignals };
}

async function stageOffchainProof() {
  console.log('\nStage 1: off-chain proof');
  try {
    const inRange = await makeProof(50000, 45000, 55000);
    if (!inRange.proof) throw new Error('no proof produced');
    pass('in-range payment (500 in [450,550]) proves');
  } catch (e) {
    fail('in-range payment proves', e);
  }
  try {
    await makeProof(60000, 45000, 55000);
    fail('out-of-range payment is rejected', new Error('proof generation should have failed'));
  } catch {
    pass('out-of-range payment (600 in [450,550]) is rejected');
  }
}

async function stageCommitmentDisclosure() {
  console.log('\nStage 2: commitment + selective disclosure');
  try {
    const r = randomFieldElement();
    const a = await poseidonCommitment(50000, r);
    const b = await poseidonCommitment(50000, r);
    if (a !== b) throw new Error('commitment is not deterministic');
    pass('Poseidon commitment is deterministic');
  } catch (e) {
    fail('commitment determinism', e);
  }
  try {
    const vk = newViewingKey();
    const w = { amountCents: 50000, randomness: randomFieldElement() };
    const opened = openWitness(vk, sealWitness(vk, w));
    if (!opened || opened.amountCents !== w.amountCents) throw new Error('seal/open mismatch');
    if (openWitness(newViewingKey(), sealWitness(vk, w)) !== null) throw new Error('wrong key opened the seal');
    pass('viewing-key seal round-trips and rejects the wrong key');

    const commitment = await poseidonCommitment(w.amountCents, w.randomness);
    const row = { id: '1', value_commitment: commitment, disclosure: sealWitness(vk, w) } as unknown as PaymentRow;
    const d = (await disclosePayments(vk, [row])).get('1')!;
    if (!(d.amountCents === w.amountCents && d.matchesOnChain)) throw new Error('disclosure did not match the commitment');
    pass('disclosed amount re-verifies against the commitment');
  } catch (e) {
    fail('selective disclosure', e);
  }
}

async function stageOnchainProof() {
  console.log('\nStage 3: on-chain proof verification (PaymentVerifier)');
  if (!process.env.COMPANY_SECRET_KEY || !CONTRACTS.paymentVerifier) {
    skip('verify + record on-chain', 'set COMPANY_SECRET_KEY and PAYMENT_VERIFIER_CONTRACT_ID');
    return;
  }
  try {
    const { recordProofOnChain, isVerifiedOnChain } = await import('@/lib/stellar/soroban');
    const { commitment, proof, publicSignals } = await makeProof(50000, 45000, 55000);
    const paymentTxHash = randomBytes(32);
    const { proofId, txHash } = await recordProofOnChain({
      companySecret: process.env.COMPANY_SECRET_KEY!,
      workerAddressHash: createHash('sha256').update('GTESTWORKER').digest(),
      paymentTxHash,
      valueCommitment: fieldToBe32(commitment),
      proofBytes: encodeProof(proof),
      publicSignalsBytes: encodePublicSignals(publicSignals),
    });
    if (!proofId || !txHash) throw new Error('no proof id / tx hash returned');
    pass(`valid proof recorded on-chain (proof ${proofId}, tx ${txHash.slice(0, 10)}...)`);
    const verified = await isVerifiedOnChain(paymentTxHash);
    if (!verified) throw new Error('isVerifiedOnChain returned false for the recorded payment');
    pass('contract reports the payment as verified');
  } catch (e) {
    fail('verify + record on-chain', e);
  }
}

async function stageSettlement() {
  console.log('\nStage 4: on-chain settlement record');
  if (!process.env.COMPANY_SECRET_KEY) {
    skip('settle on-chain', 'set COMPANY_SECRET_KEY');
    return;
  }
  try {
    const { settlePaymentRecord } = await import('@/lib/stellar/transactions');
    const worker = Keypair.random().publicKey();
    const settlement = await settlePaymentRecord({
      companySecret: process.env.COMPANY_SECRET_KEY!,
      workerAddress: worker,
      reference: 'E2E-VALIDATION',
    });
    if (settlement) pass(`settlement posted (tx ${settlement.hash.slice(0, 10)}..., asset ${settlement.asset})`);
    else skip('settle on-chain', 'returned null (best-effort: recipient could not be funded on testnet)');
  } catch (e) {
    fail('settle on-chain', e);
  }
}

async function main() {
  console.log('ShieldPay end-to-end validation');
  await stageOffchainProof();
  await stageCommitmentDisclosure();
  await stageOnchainProof();
  await stageSettlement();
  console.log(failed === 0 ? '\nValidation passed.' : `\n${failed} check(s) failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
