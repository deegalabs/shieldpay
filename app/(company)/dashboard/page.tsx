import Link from 'next/link';
import { Send, UserPlus, ArrowUpRight, ShieldCheck } from 'lucide-react';
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
import { usd, usdRange } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function CompanyDashboard() {
  let payments: PaymentRow[] = [];
  let stats = { total: 0, verified: 0, workers: 0 };
  let pendingInvites = 0;
  let runs: PayrollRunRow[] = [];
  try {
    const session = await getSession();
    const company = session ? await getCompanyByOwner(session.sub) : null;
    if (company) {
      const [pmts, st, contractors, prs] = await Promise.all([
        listPaymentsForCompany(company.id, 10),
        companyStats(company.id),
        listContractors(company.id),
        listPayrollRuns(company.id, 5),
      ]);
      payments = pmts;
      stats = st;
      pendingInvites = contractors.filter((c) => c.status === 'invited').length;
      runs = prs;
    }
  } catch {
    /* DB not reachable — empty state */
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Verified proofs" value={stats.verified} accent icon={<ShieldCheck size={16} />} />
        <Stat label="Contractors paid" value={stats.workers} />
        <Stat label="Total payments" value={stats.total} />
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
          className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/10 px-5 py-3 text-sm transition hover:bg-warning/15"
        >
          <span className="text-foreground">
            {pendingInvites} invite{pendingInvites > 1 ? 's' : ''} pending acceptance
          </span>
          <span className="text-warning">Review →</span>
        </Link>
      )}

      {runs.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Recent payroll runs
          </h2>
          <Card className="divide-y divide-border overflow-hidden">
            {runs.map((r) => (
              <Link
                key={r.id}
                href={`/payroll/${r.id}`}
                className="flex items-center justify-between px-5 py-3.5 transition hover:bg-surface-2/40"
              >
                <div>
                  <p className="font-medium">{r.reference}</p>
                  <p className="text-xs text-muted">{r.payment_count} payments · total proven</p>
                </div>
                <span className="font-semibold">{usd(Number(r.total_cents))} USDC</span>
              </Link>
            ))}
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Recent payments
        </h2>
        {payments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium">No payments yet</p>
            <p className="mt-1 text-sm text-muted">
              Run your first payroll to pay a contractor and generate an on-chain proof.
            </p>
            <Button asChild className="mt-4">
              <Link href="/payroll">
                <Send size={16} /> Run payroll
              </Link>
            </Button>
          </Card>
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-surface-2/40"
              >
                <div className="min-w-[8rem]">
                  <p className="font-medium">{p.worker_name}</p>
                  <p className="text-xs text-muted">{p.reference}</p>
                </div>
                <span className="text-sm text-muted">
                  {usdRange(p.range_min, p.range_max)} USDC
                </span>
                <Badge variant="success">
                  <ShieldCheck size={12} /> Verified
                </Badge>
                <div className="flex gap-3 text-sm">
                  <a className="inline-flex items-center gap-1 text-accent hover:underline" href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
                    Proof <ArrowUpRight size={13} />
                  </a>
                  <a className="text-foreground hover:underline" href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">
                    📄 Receipt
                  </a>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      <p className="text-xs text-muted">
        Exact amounts are private. Each payment is backed by a zero-knowledge proof, verified
        on-chain, that the amount is within the agreed contractual range.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        {icon}
        {label}
      </div>
      <p className={`mt-2 text-3xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </p>
    </Card>
  );
}
