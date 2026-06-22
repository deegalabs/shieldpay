/**
 * One-time testnet setup for the USDC settlement rail.
 *
 * The settlement chooses USDC automatically when BOTH the treasury and the
 * worker hold a USDC trustline (otherwise it falls back to the native marker).
 * This script prepares the treasury side: it opens the treasury's USDC
 * trustline and funds it with self-issued test USDC, so a demo can show a real
 * USDC asset transfer on-chain. Workers open their own trustline during invite
 * acceptance.
 *
 *   COMPANY_SECRET_KEY=S... pnpm tsx scripts/setup_usdc_testnet.ts
 *
 * Optional: set USDC_ISSUER_SECRET to reuse a fixed issuer. Otherwise a fresh
 * issuer is generated and its public key is printed; set it as USDC_ISSUER in
 * the app env so the app and this script agree on the asset.
 */
import { Asset, Operation, TransactionBuilder, BASE_FEE, Keypair } from '@stellar/stellar-sdk';
import { horizonServer, networkPassphrase, loadAccount, fundTestnetAccount } from '@/lib/stellar/client';
import { USDC, NETWORK } from '@/lib/constants';

async function submit(secret: string, build: (account: Awaited<ReturnType<typeof loadAccount>>) => Operation) {
  const kp = Keypair.fromSecret(secret);
  const account = await loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(build(account))
    .setTimeout(120)
    .build();
  tx.sign(kp);
  return horizonServer.submitTransaction(tx);
}

async function main() {
  if (NETWORK !== 'testnet') throw new Error('this script targets testnet only');
  const treasurySecret = process.env.COMPANY_SECRET_KEY;
  if (!treasurySecret) throw new Error('set COMPANY_SECRET_KEY (the treasury secret)');

  // Issuer: reuse a fixed one, or mint a fresh funded issuer for the demo.
  let issuerSecret = process.env.USDC_ISSUER_SECRET;
  if (!issuerSecret) {
    const kp = Keypair.random();
    issuerSecret = kp.secret();
    console.log('Generated a fresh test issuer.');
    console.log('  Set these in the app env:');
    console.log(`    USDC_ISSUER=${kp.publicKey()}`);
    console.log(`    USDC_ISSUER_SECRET=${kp.secret()}  (only for re-running this script)`);
    await fundTestnetAccount(kp.publicKey());
  }
  const issuerKp = Keypair.fromSecret(issuerSecret);
  const issuerPublic = process.env.USDC_ISSUER || issuerKp.publicKey();
  const asset = new Asset(USDC.code, issuerPublic);

  const treasuryPublic = Keypair.fromSecret(treasurySecret).publicKey();
  try {
    await loadAccount(treasuryPublic);
  } catch {
    await fundTestnetAccount(treasuryPublic);
  }

  console.log(`\nTreasury: ${treasuryPublic}`);
  console.log(`Asset:    ${USDC.code}:${issuerPublic}\n`);

  console.log('1/2 opening treasury trustline to USDC...');
  await submit(treasurySecret, () => Operation.changeTrust({ asset }));

  console.log('2/2 issuing 100000 USDC to the treasury...');
  await submit(issuerKp.secret(), () =>
    Operation.payment({ destination: treasuryPublic, asset, amount: '100000' }),
  );

  console.log('\nDone. The treasury can now settle in USDC for any worker that has a USDC trustline.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
