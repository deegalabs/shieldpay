-- ShieldPay: remove test and probe rows from the production database.
--
-- One-off demo hygiene before recording the video. Safe by construction: it runs
-- inside a transaction and shows you what it will remove before you commit.
--
-- How to run:
--   railway connect Postgres        (opens psql against the prod DB), then \i this file
--   or paste it into the Railway dashboard Postgres query tab.
--
-- Steps: review the SELECT output, run the DELETEs, check the final counts, then
-- COMMIT if it looks right or ROLLBACK if it does not. Nothing is permanent until
-- you COMMIT.

BEGIN;

-- 1) Inventory. Look at these before deleting anything.

-- Probe and named test contractors (the curl retry loop and manual smoke tests).
SELECT id, name, email, status, anchored, created_at
FROM contractors
WHERE name IN ('Probe', 'Probe2', 'Live Test', 'Final Check', 'N2 Retest')
   OR email IN ('p@dao.xyz', 'p2@dao.xyz', 'r@dao.xyz', 'lt@dao.xyz', 'fc@dao.xyz')
ORDER BY id;

-- Test payroll runs and payments (references tagged with TEST).
SELECT id, reference, payment_count, total_cents, created_at
FROM payroll_runs
WHERE reference ILIKE '%test%'
ORDER BY id;

SELECT id, worker_name, reference, run_id, created_at
FROM payments
WHERE reference ILIKE '%test%'
ORDER BY id;

-- Tip: also eyeball the payments list for a garbled worker_name (the shell-mangled
-- entry from a curl). If you find one, note its id and add it to the DELETE below.

-- 2) Deletes. Adjust the WHERE clauses if the inventory above shows anything you
-- want to keep. Payments first, then their runs, then contractors (no FKs, but
-- this order keeps the data consistent).

DELETE FROM payments
WHERE reference ILIKE '%test%'
   OR run_id IN (SELECT id FROM payroll_runs WHERE reference ILIKE '%test%');

DELETE FROM payroll_runs
WHERE reference ILIKE '%test%';

DELETE FROM contractors
WHERE name IN ('Probe', 'Probe2', 'Live Test', 'Final Check', 'N2 Retest')
   OR email IN ('p@dao.xyz', 'p2@dao.xyz', 'r@dao.xyz', 'lt@dao.xyz', 'fc@dao.xyz');

-- 3) Final counts. Confirm the remaining data is what you want in the demo.
SELECT 'contractors' AS table, count(*) AS rows FROM contractors
UNION ALL SELECT 'payroll_runs', count(*) FROM payroll_runs
UNION ALL SELECT 'payments', count(*) FROM payments
UNION ALL SELECT 'companies', count(*) FROM companies;

-- 4) Decide.
-- COMMIT;     -- keep the changes
-- ROLLBACK;   -- undo everything in this transaction
