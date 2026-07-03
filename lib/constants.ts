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
    'GCHJZCCMKOHV7FOHTA5SBXAPIDPBPGGVMPFGDHQEMOJOLYLU7466GPKE',
} as const;

/**
 * Demo paying company shown on receipts. In production this comes from the
 * authenticated company account; for the hackathon it is fixed demo data.
 */
export const COMPANY = {
  name: 'Acme DAO',
  cnpj: '12.345.678/0001-90',
} as const;

/** Demo worker used by the one-click demo login and the payroll form default. */
export const DEMO_WORKER = {
  name: 'Jane Doe',
  address: 'GWORKER1EXAMPLEADDRESSDONOTUSE000000000000000000000000000',
} as const;

/**
 * Isolated identity for the one-click demo company (A4). The demo login is
 * scoped to this owner, never to the real treasury-owning account
 * (`COMPANY_PUBLIC_KEY`), so a demo session cannot act as the company that holds
 * funds. The seeded demo company keeps the real treasury_address for on-chain
 * settlement, but its owner_sub is this fixed, non-key identity.
 */
export const DEMO_COMPANY_SUB = 'demo:acme-dao';

/** Whether the one-click demo login is enabled. Off only if explicitly disabled. */
export const ALLOW_DEMO_LOGIN = process.env.ALLOW_DEMO_LOGIN !== 'false';

export const CONTRACTS = {
  anchorRegistry:
    process.env.ANCHOR_REGISTRY_CONTRACT_ID ??
    process.env.NEXT_PUBLIC_ANCHOR_REGISTRY_CONTRACT_ID ??
    // Stores worker-cosigned ranges (get_range), the same instance the
    // PaymentVerifier reads for Tier 2 range enforcement.
    'CA4QF73R2H2LNJ7CZUPMIXGIZS5MVTW4R3NY36CUYQJ3NJMQHQKODXI5',
  // Unified verifier instance: holds BOTH circuit keys (per-payment + aggregate)
  // so the Proof-of-Payroll can bind each line to a recorded payment on-chain.
  paymentVerifier:
    process.env.PAYMENT_VERIFIER_CONTRACT_ID ??
    process.env.NEXT_PUBLIC_PAYMENT_VERIFIER_CONTRACT_ID ??
    'CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q',
  // Same unified instance (aggregate verify + per-line binding live here too).
  payrollVerifier:
    process.env.PAYROLL_VERIFIER_CONTRACT_ID ??
    process.env.NEXT_PUBLIC_PAYROLL_VERIFIER_CONTRACT_ID ??
    'CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q',
  // Income Credential verifier (feature F1): records proof-of-income
  // presentations, keyed by nullifier so a presentation cannot be replayed.
  incomeVerifier:
    process.env.INCOME_VERIFIER_CONTRACT_ID ??
    process.env.NEXT_PUBLIC_INCOME_VERIFIER_CONTRACT_ID ??
    'CBUUZGKKAODJQUFWVNJVSF7ZTVAE7P6ELURAVQTMZD2XWKUAI47LK7NT',
} as const;

/**
 * Contract ids exposed to the browser (non-custodial path). Next.js inlines
 * `NEXT_PUBLIC_*` at build time, so the company's wallet can build the Soroban
 * `verify_and_record` call client-side and sign it itself. Set these to the same
 * deployed ids as the server vars above.
 */
export const PUBLIC_CONTRACTS = {
  anchorRegistry: process.env.NEXT_PUBLIC_ANCHOR_REGISTRY_CONTRACT_ID ?? '',
  paymentVerifier: process.env.NEXT_PUBLIC_PAYMENT_VERIFIER_CONTRACT_ID ?? '',
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
