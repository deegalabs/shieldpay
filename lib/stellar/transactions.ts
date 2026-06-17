import {
  Asset,
  Operation,
  TransactionBuilder,
  Memo,
  BASE_FEE,
  Keypair,
  Account,
} from '@stellar/stellar-sdk';
import { createHash } from 'node:crypto';
import { buildAnchorMemo, buildPaymentMemo, MEMO_PREFIX, MEMO_VERSION, NETWORK } from '@/lib/constants';
import { usdcAsset } from './usdc';
import { horizonServer, networkPassphrase, loadAccount, fundTestnetAccount } from './client';

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
 * IDENTITY ANCHOR (layer 2) — a 0-amount self-payment signed by the WORKER,
 * binding their Stellar address to their legal identity (cpf_hash) + contract.
 * Effect: cryptographic, timestamped declaration of address↔identity ownership.
 */
export async function buildAnchorTx(args: {
  workerSecret: string;
  companyAddress: string;
  contractId: number;
  cpfHash: string;
}): Promise<{ xdr: string; memo: string }> {
  const kp = Keypair.fromSecret(args.workerSecret);
  const account = await loadAccount(kp.publicKey());
  const memo = buildAnchorMemo({
    companyAddress: args.companyAddress,
    contractId: args.contractId,
    cpfHash: args.cpfHash,
  });

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    // Self-payment of 1 stroop of native XLM; the memo is the legal payload.
    .addOperation(
      Operation.payment({
        destination: kp.publicKey(),
        asset: Asset.native(),
        amount: '0.0000001',
      }),
    )
    .addMemo(encodeMemo(memo))
    .setTimeout(180)
    .build();

  tx.sign(kp);
  return { xdr: tx.toXDR(), memo };
}

/**
 * PAYMENT (layer 3) — USDC sent by the COMPANY to the worker's anchored address.
 * Equivalent to a bank-deposit receipt (Art. 464 CLT, path B) once combined
 * with the anchor transaction.
 */
export async function buildPaymentTx(args: {
  companySecret: string;
  workerAddress: string;
  amountUsdc: string; // e.g. "500.00"
  contractId: number;
  reference: string; // e.g. "MAI2026"
  proofId: number | string;
}): Promise<{ xdr: string; memo: string; hash: string }> {
  const kp = Keypair.fromSecret(args.companySecret);
  const account = await loadAccount(kp.publicKey());
  const memo = buildPaymentMemo({
    contractId: args.contractId,
    reference: args.reference,
    proofId: args.proofId,
  });

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(
      Operation.payment({
        destination: args.workerAddress,
        asset: usdcAsset(),
        amount: args.amountUsdc,
      }),
    )
    .addMemo(encodeMemo(memo))
    .setTimeout(180)
    .build();

  tx.sign(kp);
  return { xdr: tx.toXDR(), memo, hash: tx.hash().toString('hex') };
}

/**
 * SETTLEMENT RECORD (layer 3, confidential) — a real, recipient-visible,
 * memo-bound on-chain transaction company → worker. It carries only a SYMBOLIC
 * amount (1 stroop of native XLM); the actual salary stays confidential as the
 * Poseidon commitment + ZK proof. This makes the on-chain payment trail real —
 * destination, timestamp, memo, ledger — WITHOUT printing the amount in clear
 * on a transparent chain. The proof is then bound to this tx's hash.
 */
export async function buildSettlementRecordTx(args: {
  companySecret: string;
  workerAddress: string;
  reference: string;
}): Promise<{ xdr: string; memo: string; hash: string }> {
  const kp = Keypair.fromSecret(args.companySecret);
  const account = await loadAccount(kp.publicKey());
  // e.g. "SHIELDPAY|PAY|v1|JUN2026" — readable on the explorer (≤28 bytes).
  const memo = [MEMO_PREFIX, 'PAY', MEMO_VERSION, args.reference].join('|');

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(
      Operation.payment({
        destination: args.workerAddress,
        asset: Asset.native(),
        amount: '0.0000001', // symbolic — the salary is the commitment, not this
      }),
    )
    .addMemo(encodeMemo(memo))
    .setTimeout(180)
    .build();

  tx.sign(kp);
  return { xdr: tx.toXDR(), memo, hash: tx.hash().toString('hex') };
}

/**
 * Best-effort settlement: produce a real on-chain settlement record. On testnet
 * an unfunded recipient is auto-funded via Friendbot so the demo always settles;
 * any failure (invalid/placeholder address, mainnet unfunded, etc.) returns null
 * so payroll still records the proof. Never throws.
 */
export async function settlePaymentRecord(args: {
  companySecret: string;
  workerAddress: string;
  reference: string;
}): Promise<{ hash: string; asset: string } | null> {
  try {
    try {
      await loadAccount(args.workerAddress);
    } catch {
      if (NETWORK === 'testnet') await fundTestnetAccount(args.workerAddress);
      else throw new Error('recipient account not found');
    }
    const { xdr, hash } = await buildSettlementRecordTx(args);
    await submit(xdr);
    return { hash, asset: 'XLM' };
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
