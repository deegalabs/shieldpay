/**
 * Off-chain database schema (Railway Postgres).
 *
 * Hybrid model: immutable, independently-verifiable facts live on-chain
 * (anchors, verified proofs); convenience metadata for the portals lives here.
 *
 * Demo-lean: a single denormalized `payments` table is enough to drive the
 * three portals. NOTE: the exact amount is NEVER stored — only the public
 * range and commitment — preserving the same privacy guarantee as the chain.
 *
 * Idempotent (CREATE ... IF NOT EXISTS), applied on first DB use.
 */
export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS payments (
  id               BIGSERIAL PRIMARY KEY,
  worker_name      TEXT NOT NULL,
  worker_address   TEXT NOT NULL,
  reference        TEXT NOT NULL,
  range_min        INTEGER NOT NULL,   -- USDC cents (public)
  range_max        INTEGER NOT NULL,   -- USDC cents (public)
  value_commitment TEXT NOT NULL,      -- Poseidon commitment (public)
  proof_id         TEXT NOT NULL,      -- id returned by PaymentVerifier
  tx_hash          TEXT NOT NULL,      -- Stellar tx that verified the proof
  verified         BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_worker ON payments(worker_address);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- Companies: one per owner (the company-role session subject).
CREATE TABLE IF NOT EXISTS companies (
  id               BIGSERIAL PRIMARY KEY,
  owner_sub        TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  cnpj             TEXT,
  treasury_address TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- N0: establish the organization with more than a name.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS type TEXT;                 -- company | dao | treasury
ALTER TABLE companies ADD COLUMN IF NOT EXISTS responsible_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS responsible_email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS auditor_contact TEXT;      -- viewing-key holder (used in N4)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS require_invoice BOOLEAN NOT NULL DEFAULT false;

-- Link payments to the paying company + denormalize payer for receipts.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_id BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_cnpj TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);

-- Contractors managed by a company (CPF stored only as a hash).
CREATE TABLE IF NOT EXISTS contractors (
  id              BIGSERIAL PRIMARY KEY,
  company_id      BIGINT NOT NULL,
  name            TEXT NOT NULL,
  cpf_hash        TEXT,
  stellar_address TEXT NOT NULL,
  range_min       INTEGER NOT NULL,
  range_max       INTEGER NOT NULL,
  anchored        BOOLEAN NOT NULL DEFAULT false,
  anchor_tx_hash  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contractors_company ON contractors(company_id);

-- N1: invite flow. A contractor starts as 'invited' (no address yet) and
-- becomes 'active' when they accept and provide their wallet.
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE contractors ALTER COLUMN stellar_address DROP NOT NULL;

-- WebAuthn (passkey) credentials for the passkey login method.
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id            BIGSERIAL PRIMARY KEY,
  handle        TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,   -- base64url
  public_key    BYTEA NOT NULL,
  counter       BIGINT NOT NULL DEFAULT 0,
  role          TEXT NOT NULL DEFAULT 'company',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webauthn_handle ON webauthn_credentials(handle);
`;
