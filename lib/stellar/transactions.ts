import { Asset, Operation, TransactionBuilder, Memo, Account } from '@stellar/stellar-sdk';
import { createHash } from 'node:crypto';
import { MEMO_PREFIX, MEMO_VERSION, NETWORK, USDC } from '@/lib/constants';
import { horizonServer, networkPassphrase, loadAccount, fundTestnetAccount } from './client';
import type { CompanySigner } from './signer';

/** The native USDC asset used for settlement (testnet issuer by default). */
export function usdcAsset(): Asset {
  return new Asset(USDC.code, USDC.issuer);
}

/** True if `account` holds a trustline to the given non-native asset. */
function hasTrustline(account: Awaited<ReturnType<typeof loadAccount>>, asset: Asset): boolean {
  return account.balances.some(
    (b) =>
      'asset_code' in b &&
      b.asset_code === asset.getCode() &&
      'asset_issuer' in b &&
      b.asset_issuer === asset.getIssuer(),
  );
}

/**
 * Stellar transaction builders for the ShieldPay flow.
 *
 * Memo note: Stellar memo_text is capped at 28 bytes. The structured memos
 * here can exceed that; when they do, we hash the full string into memo_hash
 * and keep the human-readable string off-chain (in Postgres) for the receipt.
 */

/** Encode a memo string, falling back to memo_hash when over 28 bytes. */
function encodeMemo(text: string): Memo {
  const bytes = Buffer.from(text, 'utf8');
  if (bytes.length <= 28) return Memo.text(text);
  // sha256 -> 32-byte hash memo. The full string is persisted off-chain.
  const hash = createHash('sha256').update(bytes).digest();
  return Memo.hash(hash);
}

/**
 * SETTLEMENT RECORD (layer 3, confidential): a real, recipient-visible,
 * memo-bound on-chain transaction company to worker. It carries only a SYMBOLIC
 * amount (the salary stays confidential as the Poseidon commitment + ZK proof),
 * so the on-chain trail is real (destination, timestamp, memo, ledger) without
 * printing the amount in clear. The proof is bound to this tx's hash.
 *
 * Best-effort: on testnet an unfunded recipient is auto-funded via Friendbot so
 * the demo always settles; any failure returns null so payroll still records the
 * proof. Never throws. The company signs through its CompanySigner, so the
 * server does not need the company key when a browser signer is used.
 */
export async function settlePaymentRecord(args: {
  signer: CompanySigner;
  workerAddress: string;
  reference: string;
}): Promise<{ hash: string; asset: string } | null> {
  try {
    let worker;
    try {
      worker = await loadAccount(args.workerAddress);
    } catch {
      if (NETWORK === 'testnet') {
        await fundTestnetAccount(args.workerAddress);
        worker = await loadAccount(args.workerAddress);
      } else {
        throw new Error('recipient account not found');
      }
    }

    // Prefer the real USDC rail only when both sides can transact USDC (worker
    // has the trustline, treasury holds a balance); else fall back to the native
    // XLM marker so the settlement always posts. The amount is symbolic either way.
    const usdc = usdcAsset();
    let asset: Asset = Asset.native();
    let assetLabel = 'XLM';
    try {
      const treasury = await loadAccount(args.signer.address);
      if (hasTrustline(worker, usdc) && hasTrustline(treasury, usdc)) {
        asset = usdc;
        assetLabel = usdc.getCode();
      }
    } catch {
      /* fall back to native */
    }

    const memo = encodeMemo([MEMO_PREFIX, 'PAY', MEMO_VERSION, args.reference].join('|'));
    const op = Operation.payment({
      destination: args.workerAddress,
      asset,
      amount: '0.0000001', // symbolic — the salary is the commitment, not this
    });
    const { hash } = await args.signer.submitClassic([op], memo);
    return { hash, asset: assetLabel };
  } catch {
    return null;
  }
}

/** Submit a signed transaction and wait for Horizon confirmation. */
export async function submit(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  return horizonServer.submitTransaction(tx);
}

// Re-export for callers that build their own Account objects in tests.
export { Account };
