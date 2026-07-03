import { ShieldCheck } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import {
  getCompanyByOwner,
  listPaymentsForCompany,
  listPayrollRuns,
  type PaymentRow,
  type PayrollRunRow,
} from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { usd, truncateKey } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ConnectionError } from '@/components/ui/connection-error';
import { ProofExplorerTable, type ProofRow } from './proof-explorer-table';

export const dynamic = 'force-dynamic';

/** Build a display + searchable proof row from a recorded per-payment proof. */
function paymentToRow(p: PaymentRow): ProofRow {
  return {
    id: `pay:${p.id}`,
    proofIdShort: truncateKey(p.proof_id, 8, 4),
    proofIdFull: p.proof_id,
    type: 'Payment',
    recipient: truncateKey(p.worker_address, 6, 4),
    recipientFull: p.worker_address,
    verified: p.verified,
    txHash: p.tx_hash || null,
    txShort: p.tx_hash ? truncateKey(p.tx_hash, 6, 4) : null,
    range: { minCents: p.range_min, maxCents: p.range_max },
    disclosedLabel: null,
  };
}

/** Build a proof row from an aggregate Proof-of-Payroll run (proven total). */
function runToRow(r: PayrollRunRow): ProofRow {
  const proofId = r.proof_id ?? '';
  const totalCents = Number(r.total_cents);
  return {
    id: `run:${r.id}`,
    proofIdShort: proofId ? truncateKey(proofId, 8, 4) : r.reference,
    proofIdFull: proofId || r.reference,
    type: 'Proof-of-Payroll',
    recipient: r.reference,
    recipientFull: r.reference,
    verified: r.proof_verified,
    txHash: r.proof_tx_hash,
    txShort: r.proof_tx_hash ? truncateKey(r.proof_tx_hash, 6, 4) : null,
    range: null,
    disclosedLabel: `${usd(totalCents)} total`,
  };
}

export default async function ProofExplorerPage() {
  let payments: PaymentRow[] = [];
  let runs: PayrollRunRow[] = [];
  let dbError = false;

  try {
    const session = await getSession();
    const company = session ? await getCompanyByOwner(session.sub) : null;
    if (company) {
      [payments, runs] = await Promise.all([
        listPaymentsForCompany(company.id, 100),
        listPayrollRuns(company.id, 50),
      ]);
    }
  } catch {
    dbError = true;
  }

  // Merge the two proof sources into one ledger, newest first. A payroll run with
  // no proof yet still appears, in its calm "Computing" state.
  const rows: ProofRow[] = [
    ...payments.map((p) => ({ createdAt: p.created_at, row: paymentToRow(p) })),
    ...runs.map((r) => ({ createdAt: r.created_at, row: runToRow(r) })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((x) => x.row);

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <p className="overline">On-chain proofs</p>
        <h1 className="font-mono text-display-lg text-fg-default">Proof Explorer</h1>
        <p className="max-w-2xl text-sm text-fg-subtle">
          Every payment and payroll run leaves a proof recorded on-chain. The agreed range is
          shown; the exact amount stays sealed.
        </p>
      </header>

      {/* A thrown read is not an empty account. Say so plainly, do not fake success. */}
      {dbError ? (
        <ConnectionError
          title="We cannot reach your proofs right now."
          message="Your records are safe. Please try again in a moment."
        />
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-xl bg-surface-2 text-fg-subtle"
          >
            <ShieldCheck size={20} strokeWidth={1.5} />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-fg-strong">No proofs yet</p>
            <p className="text-sm text-fg-subtle">
              Run your first payroll to record a verifiable on-chain proof.
            </p>
          </div>
        </Card>
      ) : (
        <ProofExplorerTable rows={rows} explorerBase={EXPLORER_BASE} />
      )}
    </div>
  );
}
