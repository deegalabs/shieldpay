import { FileText, ShieldCheck, ArrowUpRight, Download } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, listPaymentsForCompany, type PaymentRow } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { MaskedAmount } from '@/components/ui/masked-amount';
import { StatFigure } from '@/components/ui/stat-figure';
import { ConnectionError } from '@/components/ui/connection-error';

export const dynamic = 'force-dynamic';

const OVERLINE = 'text-xs font-[550] uppercase tracking-[0.06em] text-fg-subtle';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB');
}

/**
 * Receipt table columns. The amount lives in the signature masked/verified
 * component (range only, never the exact figure), the actions cell keeps the
 * proof and PDF as real link cells so a row-level link never swallows them.
 */
const columns: Array<Column<PaymentRow>> = [
  {
    key: 'date',
    header: 'Date',
    cell: (p) => <span className="figure text-fg-subtle">{formatDate(p.created_at)}</span>,
  },
  {
    key: 'contributor',
    header: 'Contributor',
    cell: (p) => (
      <span className="inline-flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-lg bg-surface-2 text-fg-subtle"
        >
          <FileText size={15} strokeWidth={1.5} />
        </span>
        <span className="font-medium text-fg-default">{p.worker_name}</span>
      </span>
    ),
  },
  {
    key: 'reference',
    header: 'Reference',
    cell: (p) => <span className="text-fg-subtle">{p.reference}</span>,
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'money',
    cell: (p) => (
      <MaskedAmount
        state="verified"
        range={{ minCents: p.range_min, maxCents: p.range_max }}
        proofId={p.proof_id}
      />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: () => (
      <Badge variant="success">
        <ShieldCheck size={12} /> Verified
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: 'Receipt',
    align: 'right',
    cell: (p) => (
      <span className="inline-flex items-center justify-end gap-4">
        <a
          className="inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg-default"
          href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
          target="_blank"
          rel="noreferrer"
        >
          Proof <ArrowUpRight size={13} />
        </a>
        <a
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-strong hover:text-fg-default"
          href={`/api/receipt?id=${p.id}`}
          target="_blank"
          rel="noreferrer"
        >
          <Download size={14} /> PDF
        </a>
      </span>
    ),
  },
];

export default async function ReceiptsPage() {
  let payments: PaymentRow[] = [];
  let dbError = false;
  try {
    const session = await getSession();
    const company = session ? await getCompanyByOwner(session.sub) : null;
    if (company) payments = await listPaymentsForCompany(company.id, 100);
  } catch {
    dbError = true;
  }

  const contributors = new Set(payments.map((p) => p.worker_name)).size;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-default">Receipts</h1>
        <p className="max-w-2xl text-sm text-fg-subtle">
          Every payroll payment leaves a downloadable receipt bound to its on-chain proof. The
          agreed range is shown; the exact amount stays private.
        </p>
      </header>

      {dbError ? (
        <ConnectionError
          title="We cannot reach your receipts right now."
          message="Your records are safe. Please try again in a moment."
        />
      ) : payments.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-xl bg-surface-2 text-fg-subtle"
          >
            <FileText size={20} strokeWidth={1.5} />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-fg-strong">No receipts yet</p>
            <p className="text-sm text-fg-subtle">Receipts appear here after you run a payroll.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid max-w-md grid-cols-2 gap-4">
            <StatFigure variant="secondary" label="Receipts" value={payments.length} />
            <StatFigure variant="secondary" label="Contributors" value={contributors} />
          </div>

          <section className="space-y-3">
            <p className={OVERLINE}>Payment history</p>
            <Card className="overflow-hidden">
              <DataTable
                columns={columns}
                rows={payments}
                rowKey={(p) => p.id}
                caption="Payroll receipts with verified proofs and downloadable PDFs."
              />
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
