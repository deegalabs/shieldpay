/**
 * USDC support: asset, trustline check, and changeTrust builder.
 *
 * Not wired into the current flow. Settlement uses a symbolic native-XLM record
 * to keep the amount private (see docs/DECISIONS.md). This module is the prebuilt
 * infrastructure for the deferred real-USDC payment path.
 */
import {
  Asset,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  Keypair,
} from '@stellar/stellar-sdk';
import { USDC } from '@/lib/constants';
import { horizonServer, networkPassphrase, loadAccount } from './client';

/**
 * The USDC asset object for the active network.
 * Lazily constructed so an invalid/missing issuer never breaks the Next.js
 * build (route modules are evaluated during page-data collection).
 */
export function usdcAsset(): Asset {
  return new Asset(USDC.code, USDC.issuer);
}

/**
 * Whether an account already trusts (and can receive) USDC.
 * A receiving account MUST establish a trustline before any payment succeeds.
 */
export async function hasUsdcTrustline(publicKey: string): Promise<boolean> {
  const account = await loadAccount(publicKey);
  return account.balances.some(
    (b) =>
      b.asset_type !== 'native' &&
      'asset_code' in b &&
      b.asset_code === USDC.code &&
      b.asset_issuer === USDC.issuer,
  );
}

/**
 * Build + sign a changeTrust transaction for USDC.
 * Must be signed by the WORKER (the account establishing trust), not the company.
 * The worker account needs ~0.5 XLM of reserve free for the new trustline.
 */
export async function buildUsdcTrustlineTx(workerSecret: string): Promise<string> {
  const kp = Keypair.fromSecret(workerSecret);
  const account = await loadAccount(kp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(Operation.changeTrust({ asset: usdcAsset() }))
    .setTimeout(180)
    .build();

  tx.sign(kp);
  return tx.toXDR();
}

/** Submit a signed XDR transaction to Horizon. */
export async function submitTransaction(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  return horizonServer.submitTransaction(tx);
}
