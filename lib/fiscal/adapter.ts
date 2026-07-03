import { createHash } from 'crypto';

/**
 * Fiscal-document (Brazilian nota fiscal / NFS-e) adapter.
 *
 * IMPORTANT: this is a MOCK for development and demo. It does NOT call any real
 * tax authority or municipal NFS-e web service. `MockNfseAdapter` returns a
 * deterministic, invented document so the linkage flow runs end to end and can be
 * tested offline.
 *
 * A production adapter MUST call a real NFS-e provider, per municipality (each
 * city has its own web service and rules), or via an aggregator such as Focus NFe
 * or eNotas, with that provider's own authentication, retries, and asynchronous
 * status callbacks (issuance is typically not instantaneous). None of that exists
 * here yet. This is tracked as base-only in docs/ROADMAP.md (F3).
 *
 * `getNfseAdapter()` returns the mock today, leaving room to select a real
 * env-configured adapter later without changing the callers.
 */

/** Input for issuing a fiscal document against a recorded payment. */
export interface FiscalIssueInput {
  /** Payment reference (e.g. 'MAY2026'); used to derive a deterministic id in the mock. */
  reference: string;
  /** Recipient tax id (CPF/CNPJ) or, when unavailable, the recipient name. */
  recipient: string;
  /** Service description that appears on the fiscal document. */
  description: string;
  /** Optional gross amount in USDC cents (public). The mock does not require it. */
  amountCents?: number | null;
}

/** A fiscal document as returned by an adapter. In the mock these fields are invented. */
export interface FiscalDocument {
  provider: string;
  invoiceNumber: string;
  invoiceSeries?: string;
  invoiceUrl?: string;
  externalId: string;
  status: FiscalStatus;
  /** ISO 8601 timestamp of issuance. */
  issuedAt: string;
}

/** Lifecycle status of a fiscal document. */
export type FiscalStatus = 'issued' | 'pending' | 'error';

/** Single interface every fiscal-document backend implements. */
export interface NfseAdapter {
  issue(input: FiscalIssueInput): Promise<FiscalDocument>;
  getStatus(externalId: string): Promise<FiscalStatus>;
}

/** Stable short hex digest, used to derive deterministic mock document ids. */
function digest(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Deterministic, offline mock. NO network call, NO randomness, NO wall-clock:
 * every field is derived from the input so the same payment always yields the
 * same document. The issuance timestamp is derived from the reference (a fixed,
 * reproducible instant) rather than the current time so results stay stable in
 * tests and demos. This is NOT a real nota fiscal.
 */
export class MockNfseAdapter implements NfseAdapter {
  readonly provider = 'mock-nfse';

  async issue(input: FiscalIssueInput): Promise<FiscalDocument> {
    const seed = digest(`${input.reference}|${input.recipient}|${input.description}`);
    // Human-looking but clearly synthetic invoice number and provider id.
    const invoiceNumber = `MOCK-${seed.slice(0, 12).toUpperCase()}`;
    const externalId = `mock-nfse_${seed.slice(0, 24)}`;
    // Deterministic instant seeded from the digest (no Date.now): a fixed offset
    // (in days) from the Unix epoch, so the value never changes between runs.
    const days = parseInt(seed.slice(24, 30), 16) % 3650;
    const issuedAt = new Date(days * 86_400_000).toISOString();
    return {
      provider: this.provider,
      invoiceNumber,
      invoiceSeries: 'MOCK',
      invoiceUrl: `https://example.invalid/nfse/mock/${externalId}`,
      externalId,
      status: 'issued',
      issuedAt,
    };
  }

  async getStatus(_externalId: string): Promise<FiscalStatus> {
    // The mock issues synchronously, so any known document is already 'issued'.
    return 'issued';
  }
}

let adapter: NfseAdapter | null = null;

/**
 * Return the process-wide fiscal-document adapter. Today this is always the mock.
 * A future real adapter can be selected here from an env var (for example
 * FISCAL_PROVIDER=focus-nfe) without changing any caller.
 */
export function getNfseAdapter(): NfseAdapter {
  if (!adapter) adapter = new MockNfseAdapter();
  return adapter;
}
