/**
 * Off-chain database schema (Railway Postgres).
 *
 * Hybrid model: immutable, independently-verifiable facts live on-chain
 * (anchors, verified proofs); convenience metadata for the portals lives here.
 *
 * Demo-lean: a single denormalized `payments` table is enough to drive the
 * three portals. NOTE: the exact amount is NEVER stored, only the public
 * range and commitment, preserving the same privacy guarantee as the chain.
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

-- N3: confidential payroll runs (batch). Individual amounts stay private
-- (commitment per payment); the run stores the total the company proves.
CREATE TABLE IF NOT EXISTS payroll_runs (
  id            BIGSERIAL PRIMARY KEY,
  company_id    BIGINT NOT NULL,
  reference     TEXT NOT NULL,
  total_cents   BIGINT NOT NULL DEFAULT 0,
  payment_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS run_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_payments_run ON payments(run_id);
CREATE INDEX IF NOT EXISTS idx_runs_company ON payroll_runs(company_id);

-- Aggregate Proof-of-Payroll: one on-chain proof per run attesting the sum of
-- all hidden amounts equals total_cents and each is within range, no salary shown.
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS proof_id TEXT;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS proof_tx_hash TEXT;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS proof_verified BOOLEAN NOT NULL DEFAULT false;

-- Opaque public id for URLs/routes (Stripe-style run_...). Mirrors contractors:
-- the numeric id stays the primary key for all internal relations (payments.run_id,
-- finalize/proof updates); only the public-facing run route resolves by public_id.
-- New rows get a nanoid from the app; existing rows are backfilled here with an
-- md5-derived id (no re-seed). Kept nullable on purpose.
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS public_id TEXT;
UPDATE payroll_runs SET public_id = 'run_' || substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 16) WHERE public_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_runs_public_id ON payroll_runs(public_id);

-- N4: selective disclosure ("viewing key"). The company holds a viewing key;
-- with it an authorized auditor can reveal AND re-verify exact amounts against
-- the on-chain commitments. The chain/public view still only sees commitments.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS viewing_key TEXT;
ALTER TABLE payments  ADD COLUMN IF NOT EXISTS disclosure TEXT; -- sealed {amountCents, randomness}

-- F1: employer attestation key seed. The employer BabyJubJub signing key (proof
-- of income) derives from this dedicated per-company seed, INDEPENDENT of the
-- viewing key. Kept separate so a viewing-key (disclosure) compromise cannot
-- forge income attestations, and the two secrets rotate independently. Stored
-- encrypted at rest, exactly like viewing_key.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employer_seed TEXT;

-- Disclosure epoch: every disclose link carries the epoch it was minted under.
-- Bumping it (rotate) instantly invalidates all outstanding disclose links, so a
-- leaked viewing-key link can be revoked without rotating the key or re-sealing.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS disclose_epoch INTEGER NOT NULL DEFAULT 1;

-- Disclosure audit log: one row every time a disclose-tier disclosure is served.
-- Records totals and match/live flags for accountability, never per-line amounts,
-- and stores only a sha256 of the auditor token (never the raw token).
CREATE TABLE IF NOT EXISTS disclosure_log (
  id                    BIGSERIAL PRIMARY KEY,
  company_id            BIGINT,
  token_hash            TEXT,
  payment_count         INT,
  disclosed_total_cents BIGINT,
  all_match             BOOLEAN,
  verified_live         BOOLEAN,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- One-time disclosure links: a row is claimed the first time a one-time link
-- discloses. A second attempt finds the row already present and drops to
-- read-only, so a one-time link can never re-disclose.
CREATE TABLE IF NOT EXISTS disclosure_token_use (
  jti     TEXT PRIMARY KEY,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- N5: real, recipient-visible, memo-bound on-chain settlement record. Carries a
-- symbolic amount only (the salary stays confidential as the commitment); the
-- proof is bound to this tx hash. Null when settlement was skipped (best-effort).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_tx_hash TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_asset TEXT;

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

-- Opaque public id for URLs/routes (Stripe-style ctr_...). The numeric id stays
-- the primary key for all internal foreign-key relations; only the public-facing
-- routes resolve by public_id. New rows get a nanoid from the app; existing rows
-- are backfilled here with an md5-derived id (no re-seed). Kept nullable on purpose.
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS public_id TEXT;
UPDATE contractors SET public_id = 'ctr_' || substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 16) WHERE public_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contractors_public_id ON contractors(public_id);

-- F3: fiscal-document linkage (Brazilian nota fiscal / NFS-e). Ties a recorded
-- payment to an external fiscal document. MOCK-BACKED for now: the invoice data is
-- produced by lib/fiscal/adapter.ts (MockNfseAdapter), NOT by a real municipal
-- NFS-e web service. A production adapter (per municipality, or via a provider such
-- as Focus NFe or eNotas) replaces the mock later. Tracked as base-only in
-- docs/ROADMAP.md. No amount is required; amount_cents is optional and public.
CREATE TABLE IF NOT EXISTS fiscal_link (
  id             BIGSERIAL PRIMARY KEY,
  payment_id     BIGINT NOT NULL,        -- references payments(id)
  company_id     BIGINT NOT NULL,        -- paying company (owner check)
  provider       TEXT NOT NULL,          -- e.g. 'mock-nfse'
  invoice_number TEXT NOT NULL,
  invoice_series TEXT,
  invoice_url    TEXT,
  status         TEXT NOT NULL,          -- e.g. 'issued'
  amount_cents   INTEGER,                -- optional, public
  external_id    TEXT,                   -- provider-side document id
  issued_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fiscal_link_payment ON fiscal_link(payment_id);
-- A payment links to at most one fiscal document. UNIQUE on payment_id enforces
-- this (a re-issue is an upsert on the same payment, not a second active row).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_fiscal_link_payment ON fiscal_link(payment_id);

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
