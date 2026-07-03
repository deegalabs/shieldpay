import Link from 'next/link';
import { Lock, BadgeCheck, CheckCircle2, ArrowRight, Hourglass } from 'lucide-react';
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
import { usd, usdRange } from '@/lib/utils';
import { ConnectionError } from '@/components/ui/connection-error';

export const dynamic = 'force-dynamic';

/** True when an ISO timestamp falls in the current calendar month. */
function inCurrentMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/** Split a formatted USD string ("$8,200.00") into the whole and cents parts. */
function splitUsd(cents: number): { whole: string; frac: string } {
  const s = usd(cents);
  const i = s.lastIndexOf('.');
  if (i === -1) return { whole: s, frac: '00' };
  return { whole: s.slice(0, i), frac: s.slice(i + 1) };
}

/** Short mono wallet/hash for the ledger proof cell: 033d..f89c. */
function shortProof(hash: string): string {
  if (hash.length <= 8) return hash;
  return `${hash.slice(0, 4)}..${hash.slice(-4)}`;
}

/** Longer hash for the Proof Explorer card: 0x33d...f89c72a1b9. */
function proofHash(hash: string): string {
  if (hash.length <= 15) return hash;
  return `${hash.slice(0, 5)}...${hash.slice(-10)}`;
}

/** "Oct 24" style settle date. */
function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

/** Compact relative time: "2m ago", "14m ago", "1h ago", "3d ago". */
function relativeTime(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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
    return <ConnectionError />;
  }

  // The only disclosed money figures are the aggregate payroll-run totals. Lead
  // with "Paid this month"; exact per-payment amounts are never stored.
  const monthRuns = runs.filter((r) => inCurrentMonth(r.created_at));
  const paidThisMonthCents = monthRuns.reduce((sum, r) => sum + Number(r.total_cents), 0);
  const lastRun = runs[0] ?? null;
  const paid = splitUsd(paidThisMonthCents);

  const ledger = payments.slice(0, 8);
  const verifiedProofs = payments.filter((p) => p.verified && p.tx_hash).slice(0, 3);

  return (
    <div className="flex flex-col xl:flex-row gap-12">
      {/* Left Column: Hero & Ledger */}
      <div className="flex-1 flex flex-col gap-12 min-w-0">
        {/* Editorial Hero Section */}
        <section className="flex flex-col lg:flex-row items-end gap-12 justify-between">
          <div className="ambient-glow inline-block">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">
              Paid This Month
            </div>
            <h1
              className="font-mono text-5xl md:text-6xl lg:text-7xl font-bold text-slate-50 tracking-tighter leading-none"
              style={{ textShadow: '0 4px 24px rgba(99, 102, 241, 0.4)' }}
            >
              {paid.whole}.
              <span className="text-slate-400 text-4xl md:text-5xl lg:text-6xl">{paid.frac}</span>{' '}
              <span className="text-indigo-400 text-2xl md:text-3xl font-normal ml-2">USDC</span>
            </h1>
          </div>
          <div className="flex flex-col gap-4 min-w-[200px] border-l border-slate-800 pl-6">
            <div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                Last payroll
              </div>
              <div className="font-mono text-lg text-slate-200">
                {lastRun ? usd(Number(lastRun.total_cents)) : '$0.00'}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                Treasury coverage
              </div>
              <div className="font-mono text-lg text-slate-200">&mdash;</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                Active contributors
              </div>
              <div className="font-mono text-lg text-slate-200">{stats.workers}</div>
            </div>
          </div>
        </section>
        {/* Lifecycle Stepper */}
        <section className="surface-200 rounded-lg p-6 border border-slate-800/50 flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4 text-sm font-mono flex-1 w-full">
            <div className="flex items-center gap-2 text-indigo-400">
              <Lock size={16} />
              <span className="uppercase tracking-wider">Proving</span>
            </div>
            <div className="h-px bg-slate-800 flex-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-indigo-500/50 to-emerald-500/50 origin-left scale-x-100"></div>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <BadgeCheck size={16} className="fill-emerald-400/20" />
              <span className="uppercase tracking-wider">Verified</span>
            </div>
            <div className="h-px bg-slate-800 flex-1"></div>
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle2 size={16} />
              <span className="uppercase tracking-wider">Settled</span>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/contractors/new"
              className="px-5 py-2 rounded border border-slate-700 text-slate-300 font-headline text-sm hover:bg-slate-800 hover:text-slate-50 transition-colors"
            >
              Add contributor
            </Link>
            <Link
              href="/payroll"
              className="px-5 py-2 rounded bg-indigo-600 text-white font-headline text-sm hover:bg-indigo-500 transition-colors flex items-center gap-2"
            >
              Run payroll
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
        {/* Dense Ledger Table */}
        <section className="flex flex-col">
          <div className="flex items-baseline gap-4 mb-4">
            <h2 className="font-mono text-sm uppercase tracking-widest text-slate-300">Ledger</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
          </div>
          <div className="surface-300 rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="py-3 px-4 w-12 text-center border-r border-slate-800/50">#</th>
                  <th className="py-3 px-6 font-medium">Contributor</th>
                  <th className="py-3 px-6 font-medium">Agreed Range</th>
                  <th className="py-3 px-6 font-medium">Proof</th>
                  <th className="py-3 px-6 font-medium text-center">On-Chain</th>
                  <th className="py-3 px-6 font-medium text-right">Settled</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm divide-y divide-slate-800/50">
                {ledger.length === 0 ? (
                  <tr>
                    <td
                      className="py-6 px-6 font-mono text-xs text-slate-500 text-center"
                      colSpan={6}
                    >
                      No payments yet
                    </td>
                  </tr>
                ) : (
                  ledger.map((p, i) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4 px-4 font-mono text-xs text-slate-600 text-center border-r border-slate-800/50">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 font-headline">
                            {p.worker_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-slate-200 font-medium">{p.worker_name}</div>
                            <div className="font-mono text-[10px] text-slate-500">
                              {shortProof(p.worker_address)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {/* Sealed range chip */}
                        <div className="inline-flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700/50 top-edge-light">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                          <Lock size={14} className="text-slate-400" />
                          <span className="font-mono text-xs text-slate-300">
                            {usdRange(p.range_min, p.range_max)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {p.verified ? (
                          <div className="font-mono text-xs text-slate-400 flex items-center gap-1 group-hover:text-indigo-400 transition-colors cursor-pointer">
                            #{p.proof_id} <span className="text-slate-600">|</span>{' '}
                            {shortProof(p.tx_hash)}
                          </div>
                        ) : (
                          <div className="font-mono text-xs text-slate-500 flex items-center gap-1">
                            <Hourglass size={14} />
                            Generating...
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {p.verified ? (
                          <BadgeCheck
                            size={18}
                            className="text-emerald-500 mx-auto drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                          />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mx-auto animate-pulse"></div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-xs text-slate-500">
                        {p.verified ? dateShort(p.created_at) : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {/* Right Column: Proof Explorer Sidebar */}
      <aside className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
        <div className="flex items-baseline justify-between border-b border-slate-800 pb-2">
          <h3 className="font-mono text-xs uppercase tracking-widest text-slate-300">
            Proof Explorer
          </h3>
          <Link
            className="font-mono text-[10px] text-indigo-400 hover:text-indigo-300 uppercase"
            href="/proof-explorer"
          >
            View All
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {verifiedProofs.length === 0 ? (
            <div className="surface-200 rounded p-4 border border-slate-800/50 font-mono text-xs text-slate-500">
              No verified proofs yet
            </div>
          ) : (
            verifiedProofs.map((p) => (
              <div
                key={p.id}
                className="surface-200 rounded p-4 border border-slate-800/50 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <BadgeCheck size={14} className="text-emerald-500" />
                    <span className="font-mono text-xs text-slate-300">ZKP#{p.proof_id}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {relativeTime(p.created_at)}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-400 break-all bg-slate-900/50 p-2 rounded">
                  {proofHash(p.tx_hash)}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
