/**
 * Off-chain database schema (Railway Postgres).
 *
 * Hybrid model: what must be immutable and independently verifiable lives
 * on-chain (anchors, verified proofs). Everything else — metadata, history,
 * generated PDFs, auditor links — lives here.
 *
 * Expressed as plain SQL DDL so it is ORM-agnostic. Apply with any migration
 * runner (e.g. `psql $DATABASE_URL -f lib/db/schema.sql`).
 */

export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS companies (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  cnpj          TEXT NOT NULL,
  stellar_address TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workers (
  id              BIGSERIAL PRIMARY KEY,
  company_id      BIGINT NOT NULL REFERENCES companies(id),
  name            TEXT NOT NULL,
  cpf_hash        TEXT NOT NULL,           -- sha256(cpf), never plaintext CPF
  stellar_address TEXT NOT NULL,
  contract_min    INTEGER NOT NULL,        -- USDC cents
  contract_max    INTEGER NOT NULL,        -- USDC cents
  contract_hash   TEXT,                    -- sha256 of signed contract PDF
  anchored        BOOLEAN NOT NULL DEFAULT false,
  anchor_tx_hash  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, stellar_address)
);

CREATE TABLE IF NOT EXISTS payments (
  id                BIGSERIAL PRIMARY KEY,
  company_id        BIGINT NOT NULL REFERENCES companies(id),
  worker_id         BIGINT NOT NULL REFERENCES workers(id),
  reference         TEXT NOT NULL,         -- e.g. "MAI2026"
  amount_cents      INTEGER NOT NULL,      -- exact amount, off-chain only
  value_commitment  TEXT NOT NULL,         -- Poseidon commitment (on-chain public)
  payment_tx_hash   TEXT NOT NULL,
  proof_id          BIGINT,                -- id returned by PaymentVerifier
  verified          BOOLEAN NOT NULL DEFAULT false,
  verified_at_ledger INTEGER,
  receipt_pdf_url   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payment_tx_hash)
);

CREATE TABLE IF NOT EXISTS auditor_links (
  id           BIGSERIAL PRIMARY KEY,
  company_id   BIGINT NOT NULL REFERENCES companies(id),
  token        TEXT NOT NULL UNIQUE,
  period_from  DATE NOT NULL,
  period_to    DATE NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_workers_company ON workers(company_id);
`;
