/**
 * Guarded production cleanup (B1). Removes the pre-A4 demo company that was owned
 * by the treasury key (COMPANY_PUBLIC_KEY) and its dependent rows, plus orphaned
 * payments with no company. It NEVER touches the isolated demo company
 * (DEMO_COMPANY_SUB) or any real user company.
 *
 * Safe by default:
 *   - Does nothing unless CLEANUP_DB=1.
 *   - Dry-run (prints what it would delete) unless CLEANUP_DB_APPLY=1.
 *
 * Run against the production environment (secrets never printed):
 *   railway run -- CLEANUP_DB=1 pnpm tsx scripts/cleanup_db.ts            # dry-run
 *   railway run -- CLEANUP_DB=1 CLEANUP_DB_APPLY=1 pnpm tsx scripts/cleanup_db.ts   # apply
 */
import { getPool } from '@/lib/db/client';
import { DEMO_COMPANY_SUB } from '@/lib/constants';

async function main() {
  if (process.env.CLEANUP_DB !== '1') {
    console.log('cleanup_db: set CLEANUP_DB=1 to run (dry-run), CLEANUP_DB_APPLY=1 to apply.');
    return;
  }
  const apply = process.env.CLEANUP_DB_APPLY === '1';
  const treasuryOwner = process.env.COMPANY_PUBLIC_KEY;
  if (!treasuryOwner) {
    console.log('cleanup_db: COMPANY_PUBLIC_KEY not set, nothing to target.');
    return;
  }
  const pool = getPool();

  // The pre-A4 demo company (owned by the treasury key), if it still exists.
  const { rows: oldCos } = await pool.query<{ id: string; owner_sub: string }>(
    `SELECT id, owner_sub FROM companies WHERE owner_sub = $1`,
    [treasuryOwner],
  );
  const oldIds = oldCos.map((c) => c.id);

  // Never touch the isolated demo company or real companies.
  if (oldCos.some((c) => c.owner_sub === DEMO_COMPANY_SUB)) {
    console.log('cleanup_db: refusing to target the isolated demo company. Aborting.');
    return;
  }

  const count = async (sql: string, args: unknown[]) =>
    Number((await pool.query<{ n: string }>(sql, args)).rows[0]?.n ?? 0);

  const orphanPayments = await count(`SELECT COUNT(*) n FROM payments WHERE company_id IS NULL`, []);
  const oldPayments = oldIds.length
    ? await count(`SELECT COUNT(*) n FROM payments WHERE company_id = ANY($1)`, [oldIds])
    : 0;
  const oldRuns = oldIds.length
    ? await count(`SELECT COUNT(*) n FROM payroll_runs WHERE company_id = ANY($1)`, [oldIds])
    : 0;
  const oldContractors = oldIds.length
    ? await count(`SELECT COUNT(*) n FROM contractors WHERE company_id = ANY($1)`, [oldIds])
    : 0;

  console.log('cleanup_db target:');
  console.log(`  old demo companies (owner = treasury): ${oldIds.length}`);
  console.log(`  their contractors:                     ${oldContractors}`);
  console.log(`  their payroll runs:                    ${oldRuns}`);
  console.log(`  their payments:                        ${oldPayments}`);
  console.log(`  orphan payments (company_id IS NULL):  ${orphanPayments}`);

  if (!apply) {
    console.log('\ncleanup_db: DRY RUN. Set CLEANUP_DB_APPLY=1 to delete.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (oldIds.length) {
      await client.query(`DELETE FROM payments WHERE company_id = ANY($1)`, [oldIds]);
      await client.query(`DELETE FROM payroll_runs WHERE company_id = ANY($1)`, [oldIds]);
      await client.query(`DELETE FROM contractors WHERE company_id = ANY($1)`, [oldIds]);
      await client.query(`DELETE FROM companies WHERE id = ANY($1)`, [oldIds]);
    }
    await client.query(`DELETE FROM payments WHERE company_id IS NULL`);
    await client.query('COMMIT');
    console.log('\ncleanup_db: applied.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('cleanup_db error:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
