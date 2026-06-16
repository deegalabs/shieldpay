import { Pool } from 'pg';
import { SCHEMA_SQL } from './schema';

/**
 * Postgres access for the portals. Lazy pool + idempotent schema bootstrap,
 * so the app works on a fresh Railway Postgres with no separate migration step.
 */

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL not set');
    pool = new Pool({
      connectionString,
      max: 5,
      ssl: /sslmode=require/.test(connectionString) ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

/** Create tables on first use (idempotent). */
export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((e) => {
        schemaReady = null;
        throw e;
      });
  }
  return schemaReady;
}

export interface PaymentRow {
  id: string;
  worker_name: string;
  worker_address: string;
  reference: string;
  range_min: number;
  range_max: number;
  value_commitment: string;
  proof_id: string;
  tx_hash: string;
  verified: boolean;
  created_at: string;
}

export async function insertPayment(
  p: Omit<PaymentRow, 'id' | 'created_at'>,
): Promise<PaymentRow> {
  await ensureSchema();
  const { rows } = await getPool().query<PaymentRow>(
    `INSERT INTO payments
       (worker_name, worker_address, reference, range_min, range_max,
        value_commitment, proof_id, tx_hash, verified)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      p.worker_name,
      p.worker_address,
      p.reference,
      p.range_min,
      p.range_max,
      p.value_commitment,
      p.proof_id,
      p.tx_hash,
      p.verified,
    ],
  );
  const row = rows[0];
  if (!row) throw new Error('insert returned no row');
  return row;
}

export async function listPayments(limit = 50): Promise<PaymentRow[]> {
  await ensureSchema();
  const { rows } = await getPool().query<PaymentRow>(
    `SELECT * FROM payments ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return rows;
}

export async function getPayment(id: string): Promise<PaymentRow | null> {
  await ensureSchema();
  const { rows } = await getPool().query<PaymentRow>(
    `SELECT * FROM payments WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listPaymentsForWorker(address: string): Promise<PaymentRow[]> {
  await ensureSchema();
  const { rows } = await getPool().query<PaymentRow>(
    `SELECT * FROM payments WHERE worker_address = $1 ORDER BY created_at DESC`,
    [address],
  );
  return rows;
}

// ── WebAuthn (passkey) credential storage ──────────────────────────────
export interface CredentialRow {
  id: string;
  handle: string;
  credential_id: string;
  public_key: Buffer;
  counter: string;
  role: string;
}

export async function insertCredential(c: {
  handle: string;
  credential_id: string;
  public_key: Buffer;
  counter: number;
  role: string;
}): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO webauthn_credentials (handle, credential_id, public_key, counter, role)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (credential_id) DO NOTHING`,
    [c.handle, c.credential_id, c.public_key, c.counter, c.role],
  );
}

export async function getCredentialsByHandle(handle: string): Promise<CredentialRow[]> {
  await ensureSchema();
  const { rows } = await getPool().query<CredentialRow>(
    `SELECT * FROM webauthn_credentials WHERE handle = $1`,
    [handle],
  );
  return rows;
}

export async function getCredentialById(credentialId: string): Promise<CredentialRow | null> {
  await ensureSchema();
  const { rows } = await getPool().query<CredentialRow>(
    `SELECT * FROM webauthn_credentials WHERE credential_id = $1`,
    [credentialId],
  );
  return rows[0] ?? null;
}

export async function updateCredentialCounter(credentialId: string, counter: number): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE webauthn_credentials SET counter = $2 WHERE credential_id = $1`,
    [credentialId, counter],
  );
}

export async function paymentStats(): Promise<{
  total: number;
  verified: number;
  workers: number;
}> {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE verified)::int AS verified,
            COUNT(DISTINCT worker_address)::int AS workers
     FROM payments`,
  );
  return rows[0] ?? { total: 0, verified: 0, workers: 0 };
}
