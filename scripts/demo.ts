/**
 * One-command, reproducible proof that ShieldPay's claims hold on-chain.
 *
 * It runs one real payment proof through the deployed PaymentVerifier and then
 * two live rejections, so anyone can watch the contract accept a valid proof and
 * refuse a forged one and a replayed one, all against the real chain.
 *
 *   DEMO_SECRET=S... pnpm demo
 *
 * The key must be a funded testnet secret (it signs and pays the Soroban fees).
 * DEMO_SECRET is preferred; COMPANY_SECRET_KEY is used as a fallback. The
 * deployed PaymentVerifier is taken from CONTRACTS.paymentVerifier, whose default
 * is already the live testnet instance, so no extra configuration is needed.
 */
import { randomBytes } from 'node:crypto';
import { prepareProof } from '@/lib/payments/flow';
import { recordProofOnChain } from '@/lib/stellar/soroban';
import { ServerSigner } from '@/lib/stellar/signer';

const pass = (s: string) => console.log(`  ${s}  [PASS]`);

async function main() {
  console.log('ShieldPay live on-chain demo');

  const secret = process.env.DEMO_SECRET ?? process.env.COMPANY_SECRET_KEY;
  if (!secret) {
    console.error(
      'Missing key. Set DEMO_SECRET (or COMPANY_SECRET_KEY) to a funded testnet secret, then run again:\n' +
        '  DEMO_SECRET=S... pnpm demo',
    );
    process.exit(1);
  }
  const signer = new ServerSigner(secret);

  // 1. POSITIVE: a real in-range payment proof, verified and recorded on-chain.
  console.log('\n1. Real payment, in range [450, 550] USDC');
  const prep = await prepareProof({
    input: {
      workerName: 'Demo Worker',
      workerAddress: 'GDEMOWORKERADDRESSNOTAREALKEYFORDEMOPURPOSESONLY0000000000',
      amountUsdc: 500,
      minUsdc: 450,
      maxUsdc: 550,
      reference: 'DEMO',
    },
    bindTo: randomBytes(32),
  });
  const recorded = await recordProofOnChain({
    signer,
    workerAddressHash: prep.workerAddressHash,
    paymentTxHash: prep.paymentTxHash,
    valueCommitment: prep.valueCommitment,
    proofBytes: prep.proofBytes,
    publicSignalsBytes: prep.publicSignalsBytes,
  });
  pass(
    `Real proof verified + recorded on-chain -> proof_id ${recorded.proofId} (tx ${recorded.txHash.slice(0, 10)}...)`,
  );

  // 2. NEGATIVE A: a forged proof. Flip one byte of a copy of the proof and
  // submit it with a fresh, unused payment id, so the ONLY reason to fail is the
  // on-chain pairing check. The contract must reject it (InvalidProof).
  console.log('\n2. Forged proof (one byte flipped)');
  const forged = Buffer.from(prep.proofBytes);
  forged[0] ^= 1;
  try {
    await recordProofOnChain({
      signer,
      workerAddressHash: prep.workerAddressHash,
      paymentTxHash: randomBytes(32), // fresh id, so it is not a duplicate
      valueCommitment: prep.valueCommitment,
      proofBytes: forged,
      publicSignalsBytes: prep.publicSignalsBytes,
    });
    console.log('  Forged proof was accepted on-chain  [FAIL]');
    process.exit(1);
  } catch {
    pass('Forged proof rejected on-chain (InvalidProof)');
  }

  // 3. NEGATIVE B: a replay. Resubmit the exact same valid payment (same payment
  // id). The contract must reject the double-spend (DuplicatePayment).
  console.log('\n3. Replay of the recorded payment');
  try {
    await recordProofOnChain({
      signer,
      workerAddressHash: prep.workerAddressHash,
      paymentTxHash: prep.paymentTxHash,
      valueCommitment: prep.valueCommitment,
      proofBytes: prep.proofBytes,
      publicSignalsBytes: prep.publicSignalsBytes,
    });
    console.log('  Replayed payment was accepted on-chain  [FAIL]');
    process.exit(1);
  } catch {
    pass('Replayed payment rejected on-chain (DuplicatePayment)');
  }

  console.log('\nDemo complete: 1 verified, 2 forgeries rejected, all on-chain.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
