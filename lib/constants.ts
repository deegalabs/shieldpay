/**
 * ShieldPay protocol constants.
 * Memo formats are the canonical on-chain audit trail (see CLAUDE.md §10).
 */

export const NETWORK = (process.env.STELLAR_NETWORK ?? 'testnet') as
  | 'testnet'
  | 'mainnet';

export const RPC_URL =
  process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org';

export const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';

export const FRIENDBOT_URL =
  process.env.STELLAR_FRIENDBOT_URL ?? 'https://friendbot.stellar.org';

export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_STELLAR_EXPLORER ??
  'https://stellar.expert/explorer/testnet';

export const USDC = {
  code: process.env.USDC_ASSET_CODE ?? 'USDC',
  // Circle USDC testnet issuer. Replace for mainnet.
  issuer:
    process.env.USDC_ISSUER ??
    'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
} as const;

export const CONTRACTS = {
  anchorRegistry: process.env.ANCHOR_REGISTRY_CONTRACT_ID ?? '',
  paymentVerifier: process.env.PAYMENT_VERIFIER_CONTRACT_ID ?? '',
} as const;

/**
 * Memo protocol — Stellar memo_text is limited to 28 bytes.
 * For payloads longer than 28 bytes we fall back to a memo_hash of the string.
 */
export const MEMO_PREFIX = 'SHIELDPAY';
export const MEMO_VERSION = 'v1';

export function buildAnchorMemo(args: {
  companyAddress: string;
  contractId: number;
  cpfHash: string; // sha256 hex of CPF, no punctuation
}): string {
  return [
    MEMO_PREFIX,
    'ANCHOR',
    MEMO_VERSION,
    args.companyAddress,
    args.contractId,
    args.cpfHash,
  ].join('|');
}

export function buildPaymentMemo(args: {
  contractId: number;
  reference: string; // e.g. "MAI2026"
  proofId: number | string;
}): string {
  return [
    MEMO_PREFIX,
    'PAY',
    MEMO_VERSION,
    args.contractId,
    args.reference,
    args.proofId,
  ].join('|');
}
