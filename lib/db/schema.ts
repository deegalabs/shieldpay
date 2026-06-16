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
`;
