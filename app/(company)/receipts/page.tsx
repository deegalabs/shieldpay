import type { ReactNode } from 'react';
import { FileText, ArrowUpRight, Download, ScrollText } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, listPaymentsForCompany, type PaymentRow } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { truncateKey } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { ConnectionError } from '@/components/ui/connection-error';

export const dynamic = 'force-dynamic';

/** "Oct 24" style settle date, mono in the ledger. */
function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

/** Short mono hash for the proof cell: 033d..f89c. */
function shortHash(hash: string): string {
  if (hash.length <= 8) return hash;
  return `${hash.slice(0, 4)}..${hash.slice(-4)}`;
}

/** Neutralize spreadsheet formula injection and quote-escape a CSV cell. */
function csvCell(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Receipt ledger columns. The amount lives in the SealedChip (agreed range only,
 * never the exact figure); the on-chain status is the emerald seal; the proof and
 * the court-receipt PDF stay as real link cells so a row-level link never swallows
 * them. Crypto terms stay out of the primary copy.
 */
const columns: Array<Column<PaymentRow>> = [
  {
    key: 'date',
    header: 'Settled',
    cell: (p) => <span className="mono text-xs text-fg-subtle">{dateShort(p.created_at)}</span>,
  },
  {
    key: 'contributor',
    header: 'Contributor',
    cell: (p) => (
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded bg-surface-3 font-headline text-sm text-fg-subtle"
        >
          {p.worker_name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-fg-strong">{p.worker_name}</div>
          <div className="mono text-[10px] text-fg-faint">{truncateKey(p.worker_address, 6, 4)}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'reference',
    header: 'Reference',
    cell: (p) => <span className="text-fg-subtle">{p.reference}</span>,
  },
  {
    key: 'amount',
    header: 'Agreed range',
    align: 'right',
    cell: (p) => (
      <span className="flex justify-end">
        <SealedChip range={{ minCents: p.range_min, maxCents: p.range_max }} />
      </span>
    ),
  },
  {
    key: 'proof',
    header: 'Proof',
    cell: (p) =>
      p.verified && p.tx_hash ? (
        <span className="mono text-xs text-fg-subtle">
          #{p.proof_id} <span className="text-fg-faint">|</span> {shortHash(p.tx_hash)}
        </span>
      ) : (
        <span className="mono text-xs text-fg-faint">Generating…</span>
      ),
  },
  {
    key: 'status',
    header: 'On-chain',
    className: 'text-center',
    headerClassName: 'text-center',
    cell: (p) => <OnChainSeal state={p.verified ? 'verified' : 'computing'} />,
  },
  {
    key: 'actions',
    header: 'Receipt',
    align: 'right',
    cell: (p) => (
      <span className="inline-flex items-center justify-end gap-4">
        <a
          className="mono inline-flex items-center gap-1 text-xs text-fg-subtle hover:text-brand-text"
          href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
          target="_blank"
          rel="noreferrer"
        >
          Proof <ArrowUpRight size={13} />
        </a>
        <a
          className="mono inline-flex items-center gap-1.5 text-xs text-fg-strong hover:text-brand-text"
          href={`/api/receipt?id=${p.id}`}
          target="_blank"
          rel="noreferrer"
        >
          <Download size={13} /> PDF
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
  const verified = payments.filter((p) => p.verified).length;

  // A privacy-preserving CSV of what is already on the page (agreed range only,
  // never the exact amount). Built server-side as a data URI so the export needs
  // no new route and no client JS.
  const csvHeader = ['Settled', 'Contributor', 'Wallet', 'Reference', 'Agreed range', 'Proof ID', 'Tx hash', 'Status'];
  const csvBody = payments.map((p) =>
    [
      dateShort(p.created_at),
      p.worker_name,
      p.worker_address,
      p.reference,
      `$${(p.range_min / 100).toFixed(2)}-$${(p.range_max / 100).toFixed(2)}`,
      p.proof_id,
      p.tx_hash,
      p.verified ? 'Verified' : 'Computing',
    ].map(csvCell).join(','),
  );
  const csv = [csvHeader.map(csvCell).join(','), ...csvBody].join('\n');
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="overline">Payment ledger</p>
          <h1 className="font-headline text-headline-lg-mobile tracking-tight text-fg-default md:text-headline-lg">
            Receipts
          </h1>
          <p className="max-w-2xl text-sm text-fg-subtle">
            Every payment leaves a downloadable receipt bound to its on-chain proof. The agreed range
            is shown; the exact amount stays private.
          </p>
        </div>
        {payments.length > 0 && (
          <Button asChild variant="ghost" className="shrink-0">
            <a href={csvHref} download="shieldpay-receipts.csv">
              <Download size={16} /> Export CSV
            </a>
          </Button>
        )}
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
        <div className="space-y-6">
          {/* Mono stat strip */}
          <div className="flex flex-wrap items-end gap-6">
            <Stat label="Receipts" value={payments.length} />
            <span aria-hidden className="h-8 w-px self-center bg-border" />
            <Stat label="Contributors" value={contributors} />
            <span aria-hidden className="h-8 w-px self-center bg-border" />
            <Stat label="Verified" value={verified} accent />
          </div>

          <section className="space-y-4">
            <div className="flex items-baseline gap-4">
              <p className="overline flex items-center gap-2">
                <ScrollText size={13} className="text-fg-faint" /> Payment history
              </p>
              <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </div>
            <Card className="overflow-hidden p-0">
              <DataTable
                columns={columns}
                rows={payments}
                rowKey={(p) => p.id}
                indexRail
                caption="Payroll receipts with verified proofs and downloadable PDFs."
              />
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

/** A quiet mono stat for the header strip: overline label over a mono figure. */
function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div>
      <div className="overline mb-1.5">{label}</div>
      <div className={`figure text-lg ${accent ? 'text-verified-text' : 'text-fg-default'}`}>{value}</div>
    </div>
  );
}
