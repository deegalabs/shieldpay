import { Pool } from 'pg';
import { SCHEMA_SQL } from './schema';
import { encryptAtRest, decryptAtRest } from '@/lib/crypto/at-rest';
import { DEMO_COMPANY_SUB } from '@/lib/constants';

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
  company_id: string | null;
  payer_name: string | null;
  payer_cnpj: string | null;
  run_id: string | null;
  disclosure: string | null; // sealed witness (N4 viewing key); null if not disclosable
  settlement_tx_hash: string | null; // N5: real recipient-visible settlement tx
  settlement_asset: string | null;
}

export async function insertPayment(
  p: Omit<PaymentRow, 'id' | 'created_at'>,
): Promise<PaymentRow> {
  await ensureSchema();
  const { rows } = await getPool().query<PaymentRow>(
    `INSERT INTO payments
       (worker_name, worker_address, reference, range_min, range_max,
        value_commitment, proof_id, tx_hash, verified, company_id, payer_name,
        payer_cnpj, run_id, disclosure, settlement_tx_hash, settlement_asset)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
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
      p.company_id,
      p.payer_name,
      p.payer_cnpj,
      p.run_id,
      p.disclosure,
      p.settlement_tx_hash,
      p.settlement_asset,
    ],
  );
  const row = rows[0];
  if (!row) throw new Error('insert returned no row');
  return row;
}

// ── Payroll runs (N3) ──────────────────────────────────────────────────
export interface PayrollRunRow {
  id: string;
  company_id: string;
  reference: string;
  total_cents: string; // bigint as string
  payment_count: number;
  created_at: string;
}

export async function createPayrollRun(companyId: string, reference: string): Promise<PayrollRunRow> {
  await ensureSchema();
  const { rows } = await getPool().query<PayrollRunRow>(
    `INSERT INTO payroll_runs (company_id, reference) VALUES ($1,$2) RETURNING *`,
    [companyId, reference],
  );
  return rows[0]!;
}

export async function finalizePayrollRun(
  id: string,
  totalCents: number,
  count: number,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE payroll_runs SET total_cents = $2, payment_count = $3 WHERE id = $1`,
    [id, totalCents, count],
  );
}

export async function getPayrollRun(id: string, companyId: string): Promise<PayrollRunRow | null> {
  await ensureSchema();
  const { rows } = await getPool().query<PayrollRunRow>(
    `SELECT * FROM payroll_runs WHERE id = $1 AND company_id = $2`,
    [id, companyId],
  );
  return rows[0] ?? null;
}

export async function listPayrollRuns(companyId: string, limit = 20): Promise<PayrollRunRow[]> {
  await ensureSchema();
  const { rows } = await getPool().query<PayrollRunRow>(
    `SELECT * FROM payroll_runs WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [companyId, limit],
  );
  return rows;
}

export async function listPaymentsForRun(runId: string): Promise<PaymentRow[]> {
  await ensureSchema();
  const { rows } = await getPool().query<PaymentRow>(
    `SELECT * FROM payments WHERE run_id = $1 ORDER BY created_at ASC`,
    [runId],
  );
  return rows;
}

// ── Companies ──────────────────────────────────────────────────────────
export interface CompanyRow {
  id: string;
  owner_sub: string;
  name: string;
  cnpj: string | null;
  treasury_address: string | null;
  type: string | null;
  responsible_name: string | null;
  responsible_email: string | null;
  auditor_contact: string | null;
  require_invoice: boolean;
  viewing_key: string | null;
  disclose_epoch: number;
  created_at: string;
}

/** Bump the disclosure epoch, instantly invalidating every outstanding
 * viewing-key (disclose) link for this company. Returns the new epoch. */
export async function rotateDiscloseEpoch(companyId: string): Promise<number> {
  await ensureSchema();
  const { rows } = await getPool().query<{ disclose_epoch: number }>(
    `UPDATE companies SET disclose_epoch = disclose_epoch + 1 WHERE id = $1
     RETURNING disclose_epoch`,
    [companyId],
  );
  return rows[0]?.disclose_epoch ?? 1;
}

export async function getCompanyByOwner(ownerSub: string): Promise<CompanyRow | null> {
  await ensureSchema();
  const { rows } = await getPool().query<CompanyRow>(
    `SELECT * FROM companies WHERE owner_sub = $1`,
    [ownerSub],
  );
  return rows[0] ?? null;
}

export async function getCompanyById(id: string): Promise<CompanyRow | null> {
  await ensureSchema();
  const { rows } = await getPool().query<CompanyRow>(
    `SELECT * FROM companies WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

/**
 * Return the company's viewing key, generating + persisting one on first use
 * (N4). The key never leaves the server except inside a company-minted,
 * expiring disclosure link.
 */
export async function ensureCompanyViewingKey(companyId: string): Promise<string> {
  await ensureSchema();
  const existing = await getPool().query<{ viewing_key: string | null }>(
    `SELECT viewing_key FROM companies WHERE id = $1`,
    [companyId],
  );
  const current = existing.rows[0]?.viewing_key;
  if (current) return decryptAtRest(current);
  const { newViewingKey } = await import('@/lib/zk/disclosure');
  const key = newViewingKey();
  await getPool().query(
    `UPDATE companies SET viewing_key = $2 WHERE id = $1 AND viewing_key IS NULL`,
    [companyId, encryptAtRest(key)],
  );
  // Re-read in case of a race (another request set it first).
  const after = await getPool().query<{ viewing_key: string | null }>(
    `SELECT viewing_key FROM companies WHERE id = $1`,
    [companyId],
  );
  const stored = after.rows[0]?.viewing_key;
  return stored ? decryptAtRest(stored) : key;
}

/** Create or update the caller's company (upsert by owner). */
export async function upsertCompany(c: {
  owner_sub: string;
  name: string;
  cnpj?: string | null;
  treasury_address?: string | null;
  type?: string | null;
  responsible_name?: string | null;
  responsible_email?: string | null;
  auditor_contact?: string | null;
  require_invoice?: boolean;
}): Promise<CompanyRow> {
  await ensureSchema();
  const { rows } = await getPool().query<CompanyRow>(
    `INSERT INTO companies
       (owner_sub, name, cnpj, treasury_address, type,
        responsible_name, responsible_email, auditor_contact, require_invoice)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (owner_sub) DO UPDATE
       SET name = EXCLUDED.name,
           cnpj = COALESCE(EXCLUDED.cnpj, companies.cnpj),
           treasury_address = COALESCE(EXCLUDED.treasury_address, companies.treasury_address),
           type = COALESCE(EXCLUDED.type, companies.type),
           responsible_name = COALESCE(EXCLUDED.responsible_name, companies.responsible_name),
           responsible_email = COALESCE(EXCLUDED.responsible_email, companies.responsible_email),
           auditor_contact = COALESCE(EXCLUDED.auditor_contact, companies.auditor_contact),
           require_invoice = EXCLUDED.require_invoice
     RETURNING *`,
    [
      c.owner_sub,
      c.name,
      c.cnpj ?? null,
      c.treasury_address ?? null,
      c.type ?? null,
      c.responsible_name ?? null,
      c.responsible_email ?? null,
      c.auditor_contact ?? null,
      c.require_invoice ?? false,
    ],
  );
  const company = rows[0]!;
  // Backfill pre-existing demo payments (no company) to the demo company so the
  // dashboard keeps showing the seeded history.
  if (c.owner_sub === DEMO_COMPANY_SUB) {
    await getPool().query(
      `UPDATE payments SET company_id = $1, payer_name = COALESCE(payer_name, $2)
       WHERE company_id IS NULL`,
      [company.id, company.name],
    );
  }
  return company;
}

// ── Contractors ────────────────────────────────────────────────────────
export interface ContractorRow {
  id: string;
  company_id: string;
  name: string;
  cpf_hash: string | null;
  stellar_address: string | null;
  range_min: number;
  range_max: number;
  anchored: boolean;
  anchor_tx_hash: string | null;
  status: string; // 'invited' | 'active'
  email: string | null;
  role: string | null;
  created_at: string;
}

/** Create an invited contractor (no wallet yet) — N1 invite flow. */
export async function createInvite(c: {
  company_id: string;
  name: string;
  email: string | null;
  role: string | null;
  range_min: number;
  range_max: number;
}): Promise<ContractorRow> {
  await ensureSchema();
  const { rows } = await getPool().query<ContractorRow>(
    `INSERT INTO contractors (company_id, name, email, role, range_min, range_max, status)
     VALUES ($1,$2,$3,$4,$5,$6,'invited') RETURNING *`,
    [c.company_id, c.name, c.email, c.role, c.range_min, c.range_max],
  );
  return rows[0]!;
}

export interface InviteView extends ContractorRow {
  company_name: string;
  company_type: string | null;
  company_treasury: string | null;
}

/** Load an invite (contractor + its company) for the public acceptance page. */
export async function getInvite(id: string): Promise<InviteView | null> {
  await ensureSchema();
  const { rows } = await getPool().query<InviteView>(
    `SELECT c.*, co.name AS company_name, co.type AS company_type,
            co.treasury_address AS company_treasury
     FROM contractors c JOIN companies co ON co.id = c.company_id
     WHERE c.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

/** Load every organization a collaborator is linked to (one row per company),
 * by the wallet address that identifies their session. A collaborator can work
 * for more than one company, each with its own role, range and anchor. */
export async function listContractorsByAddress(address: string): Promise<InviteView[]> {
  await ensureSchema();
  const { rows } = await getPool().query<InviteView>(
    `SELECT c.*, co.name AS company_name, co.type AS company_type,
            co.treasury_address AS company_treasury
     FROM contractors c JOIN companies co ON co.id = c.company_id
     WHERE c.stellar_address = $1
     ORDER BY c.created_at DESC`,
    [address],
  );
  return rows;
}

/** Record the on-chain self-anchor for an invited/active contractor (by id). */
export async function setInviteAnchored(id: string, txHash: string): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE contractors SET anchored = true, anchor_tx_hash = $2 WHERE id = $1`,
    [id, txHash],
  );
}

/** Accept an invite: set the collaborator's wallet + identity, and activate.
 * Idempotent: re-accepting an already-active invite updates the data (lets a
 * collaborator retry the on-chain anchor). */
export async function acceptInvite(
  id: string,
  data: { stellarAddress: string; cpfHash?: string | null; name?: string | null },
): Promise<ContractorRow | null> {
  await ensureSchema();
  const { rows } = await getPool().query<ContractorRow>(
    `UPDATE contractors
       SET stellar_address = $2,
           status = 'active',
           cpf_hash = COALESCE($3, cpf_hash),
           name = COALESCE($4, name)
     WHERE id = $1 AND status IN ('invited', 'active')
     RETURNING *`,
    [id, data.stellarAddress, data.cpfHash ?? null, data.name ?? null],
  );
  return rows[0] ?? null;
}

export async function listContractors(companyId: string): Promise<ContractorRow[]> {
  await ensureSchema();
  const { rows } = await getPool().query<ContractorRow>(
    `SELECT * FROM contractors WHERE company_id = $1 ORDER BY created_at DESC`,
    [companyId],
  );
  return rows;
}

export async function getContractor(id: string, companyId: string): Promise<ContractorRow | null> {
  await ensureSchema();
  const { rows } = await getPool().query<ContractorRow>(
    `SELECT * FROM contractors WHERE id = $1 AND company_id = $2`,
    [id, companyId],
  );
  return rows[0] ?? null;
}

export async function createContractor(c: {
  company_id: string;
  name: string;
  cpf_hash: string | null;
  stellar_address: string;
  range_min: number;
  range_max: number;
}): Promise<ContractorRow> {
  await ensureSchema();
  const { rows } = await getPool().query<ContractorRow>(
    `INSERT INTO contractors (company_id, name, cpf_hash, stellar_address, range_min, range_max)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [c.company_id, c.name, c.cpf_hash, c.stellar_address, c.range_min, c.range_max],
  );
  return rows[0]!;
}

export async function updateContractor(
  id: string,
  companyId: string,
  c: { name: string; stellar_address: string; range_min: number; range_max: number },
): Promise<ContractorRow | null> {
  await ensureSchema();
  const { rows } = await getPool().query<ContractorRow>(
    `UPDATE contractors SET name=$3, stellar_address=$4, range_min=$5, range_max=$6
     WHERE id=$1 AND company_id=$2 RETURNING *`,
    [id, companyId, c.name, c.stellar_address, c.range_min, c.range_max],
  );
  return rows[0] ?? null;
}

export async function deleteContractor(id: string, companyId: string): Promise<void> {
  await ensureSchema();
  await getPool().query(`DELETE FROM contractors WHERE id=$1 AND company_id=$2`, [id, companyId]);
}

export async function setContractorAnchored(
  id: string,
  companyId: string,
  txHash: string,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE contractors SET anchored=true, anchor_tx_hash=$3 WHERE id=$1 AND company_id=$2`,
    [id, companyId, txHash],
  );
}

export async function listPaymentsForCompany(companyId: string, limit = 50): Promise<PaymentRow[]> {
  await ensureSchema();
  const { rows } = await getPool().query<PaymentRow>(
    `SELECT * FROM payments WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [companyId, limit],
  );
  return rows;
}

export async function companyStats(companyId: string): Promise<{
  total: number;
  verified: number;
  workers: number;
}> {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE verified)::int AS verified,
            COUNT(DISTINCT worker_address)::int AS workers
     FROM payments WHERE company_id = $1`,
    [companyId],
  );
  return rows[0] ?? { total: 0, verified: 0, workers: 0 };
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
