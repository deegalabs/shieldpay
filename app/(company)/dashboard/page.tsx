import Link from 'next/link';
import { Send, UserPlus, ArrowUpRight, ShieldCheck, FileText, Wallet } from 'lucide-react';
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
import { usd } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatFigure } from '@/components/ui/stat-figure';
import { DataTable, type Column } from '@/components/ui/data-table';
import { MaskedAmount } from '@/components/ui/masked-amount';
import { ConnectionError } from '@/components/ui/connection-error';

export const dynamic = 'force-dynamic';

const OVERLINE = 'text-xs font-[550] uppercase tracking-[0.06em] text-fg-subtle';

/** True when an ISO timestamp falls in the current calendar month. */
function inCurrentMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
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

  const paymentColumns: Column<PaymentRow>[] = [
    {
      key: 'contributor',
      header: 'Contributor',
      cell: (p) => (
        <div className="min-w-[8rem]">
          <p className="font-medium text-fg-strong">{p.worker_name}</p>
          <p className="text-xs text-fg-subtle">{p.reference}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'money',
      cell: (p) => (
        <MaskedAmount
          state={p.verified ? 'verified' : 'masked'}
          range={{ minCents: p.range_min, maxCents: p.range_max }}
          proofId={p.proof_id}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
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
    <div className="space-y-8">
      {/* Lead with money: one glowing figure, the disclosed month-to-date total. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatFigure
          variant="hero"
          className="sm:col-span-2"
          label="Paid this month"
          value={`${usd(paidThisMonthCents)} USDC`}
          icon={<Wallet size={13} strokeWidth={1.75} aria-hidden />}
          sublabel={
            monthRuns.length > 0
              ? `Across ${monthRuns.length} payroll run${monthRuns.length > 1 ? 's' : ''}`
              : 'No payroll runs yet this month'
          }
        />
        <StatFigure
          variant="secondary"
          label="Last payroll"
          value={lastRun ? `${usd(Number(lastRun.total_cents))} USDC` : '$0.00 USDC'}
          sublabel={lastRun ? lastRun.reference : 'No runs yet'}
        />
      </div>

      {/* The counts are context, not the headline. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatFigure
          variant="secondary"
          label="Verified proofs"
          value={stats.verified}
          icon={<ShieldCheck size={13} strokeWidth={1.75} aria-hidden />}
        />
        <StatFigure variant="secondary" label="Contributors paid" value={stats.workers} />
        <StatFigure variant="secondary" label="Total payments" value={stats.total} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/payroll">
            <Send size={16} /> Run payroll
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contractors/new">
            <UserPlus size={16} /> Invite collaborator
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

      <section>
        <h2 className={`mb-3 ${OVERLINE}`}>Recent payments</h2>
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
            <DataTable
              caption="Recent payments"
              columns={paymentColumns}
              rows={payments}
              rowKey={(p) => p.id}
            />
          </Card>
        )}
      </section>

      <p className="text-xs text-fg-faint">
        Exact amounts stay private. Every payment is verified on-chain to be within the agreed range.
      </p>
    </div>
  );
}
