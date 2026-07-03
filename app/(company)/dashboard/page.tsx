import Link from 'next/link';
import { Send, UserPlus, ArrowUpRight, FileText, Wallet } from 'lucide-react';
import {
  listPaymentsForCompany,
  companyStats,
  getCompanyByOwner,
  listContractors,
  listPayrollRuns,
  type PaymentRow,
  type PayrollRunRow,
} from '@/lib/db/client';
import { getSession } from '@/lib/auth/server';
import { EXPLORER_BASE } from '@/lib/constants';
import { usd, truncateKey } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatFigure } from '@/components/ui/stat-figure';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { ConnectionError } from '@/components/ui/connection-error';

export const dynamic = 'force-dynamic';

const OVERLINE = 'overline text-fg-subtle';

/** True when an ISO timestamp falls in the current calendar month. */
function inCurrentMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/** A compact relative age for the proof explorer, e.g. "2m ago", "3h ago". */
function relativeTime(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** The settled date, rendered ledger-style: 2026.07.03. */
function settledDate(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${m}.${day}`;
}

export default async function CompanyDashboard() {
  let payments: PaymentRow[] = [];
  let stats = { total: 0, verified: 0, workers: 0 };
  let pendingInvites = 0;
  let runs: PayrollRunRow[] = [];
  let dbError = false;

  try {
    const session = await getSession();
    const company = session ? await getCompanyByOwner(session.sub) : null;
    if (company) {
      const [pmts, st, contractors, prs] = await Promise.all([
        listPaymentsForCompany(company.id, 10),
        companyStats(company.id),
        listContractors(company.id),
        // A generous window so the "paid this month" aggregate is accurate;
        // only the most recent handful are shown in the runs table.
        listPayrollRuns(company.id, 50),
      ]);
      payments = pmts;
      stats = st;
      pendingInvites = contractors.filter((c) => c.status === 'invited').length;
      runs = prs;
    }
  } catch {
    dbError = true;
  }

  // A thrown read is not the same as an honestly empty account. Say so plainly
  // instead of showing a success-looking "no payments yet" state.
  if (dbError) {
    return (
      <div className="space-y-8">
        <ConnectionError />
      </div>
    );
  }

  // The only disclosed money figures are the aggregate payroll-run totals. Lead
  // with "Paid this month"; exact per-payment amounts are never stored.
  const monthRuns = runs.filter((r) => inCurrentMonth(r.created_at));
  const paidThisMonthCents = monthRuns.reduce((sum, r) => sum + Number(r.total_cents), 0);
  const lastRun = runs[0] ?? null;
  const recentRuns = runs.slice(0, 6);
  // The proof explorer reads the same recent payments: proof id, tx, verified.
  const recentProofs = payments.slice(0, 6);

  // The signature LEDGER: contributor, sealed range, on-chain seal, settled date,
  // and the proof/receipt links carried over from the previous view.
  const ledgerColumns: Column<PaymentRow>[] = [
    {
      key: 'contributor',
      header: 'Contributor',
      cell: (p) => (
        <div className="min-w-[8rem]">
          <p className="font-medium text-fg-strong">{p.worker_name}</p>
          <p className="mono text-xs text-fg-subtle">{truncateKey(p.worker_address)}</p>
        </div>
      ),
    },
    {
      key: 'range',
      header: 'Agreed range',
      cell: (p) => <SealedChip range={{ minCents: p.range_min, maxCents: p.range_max }} />,
    },
    {
      key: 'onchain',
      header: 'On-chain',
      headerClassName: 'text-center',
      className: 'text-center',
      cell: (p) => <OnChainSeal state={p.verified ? 'verified' : 'computing'} />,
    },
    {
      key: 'settled',
      header: 'Settled',
      align: 'right',
      cell: (p) => <span className="mono text-xs text-fg-subtle">{settledDate(p.created_at)}</span>,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-3 text-sm">
          <a
            className="inline-flex items-center gap-1 text-brand-text hover:underline"
            href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
            target="_blank"
            rel="noreferrer"
          >
            Proof <ArrowUpRight size={13} />
          </a>
          <a
            className="inline-flex items-center gap-1 text-fg-strong hover:underline"
            href={`/api/receipt?id=${p.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <FileText size={13} /> Receipt
          </a>
        </div>
      ),
    },
  ];

  const runColumns: Column<PayrollRunRow>[] = [
    {
      key: 'reference',
      header: 'Reference',
      cell: (r) => <span className="font-medium text-fg-strong">{r.reference}</span>,
    },
    {
      key: 'count',
      header: 'Payments',
      align: 'right',
      cell: (r) => <span className="figure text-fg-subtle">{r.payment_count}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'money',
      cell: (r) => `${usd(Number(r.total_cents))} USDC`,
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left column: money-led hero, actions, and the signature ledger. */}
      <div className="flex flex-col gap-8 lg:col-span-8">
        {/* Lead with money: one glowing figure, the disclosed month-to-date total. */}
        <StatFigure
          variant="hero"
          label="Paid this month"
          value={`${usd(paidThisMonthCents)} USDC`}
          icon={<Wallet size={13} strokeWidth={1.75} aria-hidden />}
          sublabel={
            monthRuns.length > 0
              ? `Across ${monthRuns.length} payroll run${monthRuns.length > 1 ? 's' : ''}`
              : 'No payroll runs yet this month'
          }
        />

        {/* Secondary stats: context, not the headline. */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatFigure
            variant="secondary"
            label="Last payroll"
            value={lastRun ? `${usd(Number(lastRun.total_cents))} USDC` : '$0.00 USDC'}
            sublabel={lastRun ? lastRun.reference : 'No runs yet'}
          />
          <StatFigure variant="secondary" label="Active contributors" value={stats.workers} />
          <StatFigure variant="secondary" label="Verified proofs" value={stats.verified} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/payroll">
              <Send size={16} /> Run payroll
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/contractors/new">
              <UserPlus size={16} /> Add contributor
            </Link>
          </Button>
        </div>

        {pendingInvites > 0 && (
          <Link
            href="/contractors"
            className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/10 px-5 py-3.5 text-sm transition hover:bg-warning/15"
          >
            <span className="text-fg-strong">
              {pendingInvites} invite{pendingInvites > 1 ? 's' : ''} pending acceptance
            </span>
            <span className="text-warning">Review →</span>
          </Link>
        )}

        {/* The signature LEDGER table. */}
        <section>
          <h2 className={`mb-3 ${OVERLINE}`}>Ledger</h2>
          {payments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="font-medium text-fg-strong">No payments yet</p>
              <p className="mt-1 text-sm text-fg-subtle">
                Run your first payroll to pay a contributor and record a verifiable proof.
              </p>
              <Button asChild className="mt-4">
                <Link href="/payroll">
                  <Send size={16} /> Run payroll
                </Link>
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <DataTable
                  caption="Ledger of recent payments"
                  columns={ledgerColumns}
                  rows={payments}
                  rowKey={(p) => p.id}
                  indexRail
                />
              </div>
            </Card>
          )}
        </section>

        {recentRuns.length > 0 && (
          <section>
            <h2 className={`mb-3 ${OVERLINE}`}>Recent payroll runs</h2>
            <Card className="overflow-hidden">
              <DataTable
                caption="Recent payroll runs"
                columns={runColumns}
                rows={recentRuns}
                rowKey={(r) => r.id}
                rowHref={(r) => `/payroll/${r.id}`}
                rowLabel={(r) => `Open payroll run ${r.reference}`}
              />
            </Card>
          </section>
        )}

        <p className="text-xs text-fg-subtle">
          Exact amounts stay private. Every payment is verified on-chain to be within the agreed
          range.
        </p>
      </div>

      {/* Right column: the proof explorer, fed by the same recent payments. */}
      <aside className="lg:col-span-4">
        <Card className="flex h-fit flex-col gap-5 p-6">
          <h2 className={`border-b border-border pb-4 ${OVERLINE}`}>Proof explorer</h2>

          {recentProofs.length === 0 ? (
            <p className="text-sm text-fg-subtle">
              Proofs appear here as soon as your first payroll settles.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recentProofs.map((p) => (
                <li key={p.id}>
                  <a
                    href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-3 transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <OnChainSeal state={p.verified ? 'verified' : 'computing'} size="md" />
                    <div className="min-w-0 flex-grow">
                      <p className="mono truncate text-sm text-fg-strong">prf_{p.proof_id}</p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className={OVERLINE}>{p.verified ? 'Verified' : 'Computing'}</span>
                        <span className="mono text-xs text-fg-subtle">
                          {p.verified ? relativeTime(p.created_at) : '--'}
                        </span>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <Button asChild variant="ghost" className="mt-auto justify-center">
            <Link href="/proof-explorer">View all proofs</Link>
          </Button>
        </Card>
      </aside>
    </div>
  );
}
