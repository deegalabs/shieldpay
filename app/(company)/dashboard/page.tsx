import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Lock,
  BadgeCheck,
  CheckCircle2,
  ArrowRight,
  Hourglass,
  Fingerprint,
  ArrowDownLeft,
  Send,
  Wallet,
  ShieldCheck,
  CircleAlert,
  Check,
} from 'lucide-react';
import {
  listPaymentsForCompany,
  companyStats,
  getCompanyByOwner,
  listContractors,
  listPayrollRuns,
  type PaymentRow,
  type PayrollRunRow,
  type ContractorRow,
  type CompanyRow,
} from '@/lib/db/client';
import { getSession } from '@/lib/auth/server';
import { usd, usdRange, formatUsdc } from '@/lib/utils';
import { loadAccount } from '@/lib/stellar/client';
import { USDC } from '@/lib/constants';
import { ConnectionError } from '@/components/ui/connection-error';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';

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
  let contractors: ContractorRow[] = [];
  let company: CompanyRow | null = null;
  let dbError = false;

  try {
    const session = await getSession();
    company = session ? await getCompanyByOwner(session.sub) : null;
    if (company) {
      const [pmts, st, cts, prs] = await Promise.all([
        listPaymentsForCompany(company.id, 10),
        companyStats(company.id),
        listContractors(company.id),
        // A generous window so the "paid this month" aggregate is accurate;
        // only the most recent handful are shown in the runs table.
        listPayrollRuns(company.id, 50),
      ]);
      payments = pmts;
      stats = st;
      contractors = cts;
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

  // ── Treasury + runway ──────────────────────────────────────────────────
  // The treasury balance is a live Horizon read, so it stays in its own
  // try/catch: a Horizon outage degrades this one card to "unavailable" and
  // never takes the page down. Runway is derived from the average of the last
  // three payroll runs (skipped when there is no run history yet).
  const treasuryAddress = company?.treasury_address ?? null;
  const recentRuns = runs.slice(0, 3);
  const avgRunCents = recentRuns.length
    ? recentRuns.reduce((sum, r) => sum + Number(r.total_cents), 0) / recentRuns.length
    : 0;

  let treasuryBalanceLabel: string | null = null;
  let treasuryUnavailable = false;
  let runwayLabel: string | null = null;
  if (treasuryAddress) {
    try {
      const account = await loadAccount(treasuryAddress);
      const line = account.balances.find(
        (b) =>
          b.asset_type !== 'native' &&
          'asset_code' in b &&
          b.asset_code === USDC.code &&
          b.asset_issuer === USDC.issuer,
      );
      if (line) {
        const balanceUsdc = Number(line.balance);
        treasuryBalanceLabel = formatUsdc(balanceUsdc);
        if (avgRunCents > 0) {
          const n = Math.floor((balanceUsdc * 100) / avgRunCents);
          runwayLabel = `~${n} ${n === 1 ? 'payroll' : 'payrolls'}`;
        }
      } else {
        treasuryUnavailable = true;
      }
    } catch {
      treasuryUnavailable = true;
    }
  }

  // ── Action items ───────────────────────────────────────────────────────
  // Everyone still un-anchored needs a nudge. Invited (not yet accepted) reads
  // differently from active-but-not-anchored, so the caption reflects which.
  const needsAttention = contractors
    .filter((c) => !c.anchored)
    .map((c) => ({
      id: c.public_id,
      name: c.name,
      label: c.status === 'invited' ? 'awaiting acceptance' : 'anchor pending',
    }));

  // ── Onboarding vs. widgets ─────────────────────────────────────────────
  // A brand-new workspace (at most one contributor, no payroll history yet)
  // gets a getting-started checklist filling the space below the ledger.
  // Anything busier gets the treasury / audit / action-item widgets instead.
  const isNewWorkspace = contractors.length <= 1 && runs.length === 0;
  const onboardingSteps = [
    {
      label: 'Connect a treasury wallet',
      hint: 'Fund payroll from a wallet you control',
      done: Boolean(company?.treasury_address),
      href: '/settings',
      cta: 'Connect wallet',
    },
    {
      label: 'Invite your first contributor',
      hint: 'Add a recipient and set their agreed range',
      done: contractors.length > 0,
      href: '/contractors/new',
      cta: 'Add contributor',
    },
    {
      label: 'Contributor anchors on-chain',
      hint: 'They bind their wallet to the agreement',
      done: contractors.some((c) => c.anchored),
      href: '/contractors',
      cta: 'View contributors',
    },
    {
      label: 'Run your first payroll',
      hint: 'Pay confidentially with an on-chain proof',
      done: runs.length > 0,
      href: '/payroll',
      cta: 'Run payroll',
    },
  ];

  // The only disclosed money figures are the aggregate payroll-run totals. Lead
  // with "Paid this month"; exact per-payment amounts are never stored.
  const monthRuns = runs.filter((r) => inCurrentMonth(r.created_at));
  const paidThisMonthCents = monthRuns.reduce((sum, r) => sum + Number(r.total_cents), 0);
  const lastRun = runs[0] ?? null;
  const paid = splitUsd(paidThisMonthCents);

  const ledger = payments.slice(0, 8);
  const verifiedProofs = payments.filter((p) => p.verified && p.tx_hash).slice(0, 3);

  return (
    <>
      {/* ── Desktop: Executive Ledger (md+) ────────────────────────────── */}
      <div className="hidden md:flex flex-col xl:flex-row gap-12">
      {/* Left Column: Hero & Ledger */}
      <div className="flex-1 flex flex-col gap-12 min-w-0">
        {/* Editorial Hero Section */}
        <section className="flex flex-col lg:flex-row items-end gap-12 justify-between">
          <div className="ambient-glow inline-block">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">
              Paid This Month
            </div>
            <h1
              className="font-mono text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-50 tracking-tighter leading-none break-words"
              style={{ textShadow: '0 4px 24px rgba(99, 102, 241, 0.4)' }}
            >
              {paid.whole}.
              <span className="text-slate-400 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                {paid.frac}
              </span>{' '}
              <span className="text-indigo-400 text-2xl md:text-3xl font-normal ml-2 inline-block">
                USDC
              </span>
            </h1>
          </div>
          <div className="flex flex-col gap-4 min-w-[200px] border-l border-slate-800 pl-6">
            <div>
              <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                Last payroll
              </div>
              <div className="font-mono text-lg text-slate-200">
                {lastRun ? usd(Number(lastRun.total_cents)) : '$0.00'}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                Treasury coverage
              </div>
              <div className="font-mono text-lg text-slate-200">&mdash;</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-1">
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
            <div className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 size={16} />
              <span className="uppercase tracking-wider">Settled</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0 w-full sm:w-auto">
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
        {/* Status widgets first (glance): onboarding checklist for a new
            workspace, else treasury / audit-readiness / action items. */}
        {isNewWorkspace ? (
          <OnboardingChecklist steps={onboardingSteps} />
        ) : (
          <section className="grid gap-6 lg:grid-cols-3">
            <TreasuryCard
              treasuryAddress={treasuryAddress}
              balanceLabel={treasuryBalanceLabel}
              unavailable={treasuryUnavailable}
              runwayLabel={runwayLabel}
            />
            <ComplianceCard total={stats.total} verified={stats.verified} />
            <ActionItemsCard items={needsAttention} />
          </section>
        )}

        {/* Dense Ledger Table, last: the detailed drill-down of recent payments.
            The full, growing history lives on Receipts (see View all). */}
        <section className="flex flex-col">
          <div className="mb-4 flex items-baseline gap-4">
            <h2 className="font-mono text-sm uppercase tracking-widest text-slate-300">Ledger</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
            <Link
              href="/receipts"
              className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="py-3 px-4 w-12 text-center border-r border-slate-800/50">#</th>
                  <th className="py-3 px-6 font-medium">Contributor</th>
                  <th className="py-3 px-6 font-medium">Agreed Range</th>
                  <th className="py-3 px-6 font-medium hidden sm:table-cell">Proof</th>
                  <th className="py-3 px-6 font-medium text-center">On-Chain</th>
                  <th className="py-3 px-6 font-medium text-right hidden sm:table-cell">Settled</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm divide-y divide-slate-800/50">
                {ledger.length === 0 ? (
                  <tr>
                    <td
                      className="py-6 px-6 font-mono text-xs text-slate-400 text-center"
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
                            <div className="font-mono text-[10px] text-slate-400">
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
                      <td className="py-4 px-6 hidden sm:table-cell">
                        {p.verified ? (
                          <div className="font-mono text-xs text-slate-400 flex items-center gap-1 group-hover:text-indigo-400 transition-colors cursor-pointer">
                            #{p.proof_id} <span className="text-slate-600">|</span>{' '}
                            {shortProof(p.tx_hash)}
                          </div>
                        ) : (
                          <div className="font-mono text-xs text-slate-400 flex items-center gap-1">
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
                      <td className="py-4 px-6 text-right font-mono text-xs text-slate-400 hidden sm:table-cell">
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
            <div className="surface-200 rounded p-4 border border-slate-800/50 font-mono text-xs text-slate-400">
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
                  <span className="font-mono text-[10px] text-slate-400">
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

      {/* ── Mobile: faithful Confidential Ledger layout (below md) ──────── */}
      {/* The AppShell already renders the mobile mini-header + hamburger    */}
      {/* drawer, so this block is page content only. Every card and button  */}
      {/* uses raw slate/indigo/emerald surfaces so nothing renders white.   */}
      <div className="md:hidden flex flex-col gap-8 pb-28">
        {/* Balance card */}
        <section className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 px-6 py-10 flex flex-col items-center text-center top-edge-light">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
          <p className="relative mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
            Total Available Balance
          </p>
          <h1 className="relative font-mono text-4xl font-bold tracking-tight text-slate-50">
            {usd(paidThisMonthCents)}{' '}
            <span className="align-middle text-base font-normal text-slate-400">USDC</span>
          </h1>
        </section>

        {/* Status widgets first (glance): onboarding checklist or treasury /
            audit / action items, before the recent lists. */}
        {isNewWorkspace ? (
          <OnboardingChecklist steps={onboardingSteps} />
        ) : (
          <section className="flex flex-col gap-4">
            <TreasuryCard
              treasuryAddress={treasuryAddress}
              balanceLabel={treasuryBalanceLabel}
              unavailable={treasuryUnavailable}
              runwayLabel={runwayLabel}
            />
            <ComplianceCard total={stats.total} verified={stats.verified} />
            <ActionItemsCard items={needsAttention} />
          </section>
        )}

        {/* Recent transactions */}
        <section className="flex flex-col gap-4">
          <h2 className="px-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Recent Transactions
          </h2>
          {ledger.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-400">
              No payments yet
            </div>
          ) : (
            ledger.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 top-edge-light"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium text-slate-100">
                    {p.worker_name}
                  </span>
                  <OnChainSeal
                    state={p.verified ? 'verified' : 'computing'}
                    label={p.verified ? 'Settled' : 'Verifying'}
                    className="shrink-0"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
                  <SealedChip range={{ minCents: p.range_min, maxCents: p.range_max }} />
                  <span className="whitespace-nowrap font-mono text-xs text-slate-400">
                    {p.verified ? dateShort(p.created_at) : '--'}
                  </span>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Recent zero-knowledge proofs */}
        <section className="flex flex-col gap-4">
          <h2 className="px-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Recent Zero-Knowledge Proofs
          </h2>
          <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 top-edge-light">
            {verifiedProofs.length === 0 ? (
              <div className="font-mono text-xs text-slate-400">No verified proofs yet</div>
            ) : (
              verifiedProofs.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Fingerprint size={18} className="shrink-0 text-slate-500" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-mono text-xs text-slate-200">
                        Proof {proofHash(p.tx_hash)}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                        Generated
                      </span>
                    </div>
                  </div>
                  <OnChainSeal state="verified" className="shrink-0" />
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Sticky bottom action bar (mobile only). Sits just above the primary
          bottom tab bar (56px + safe area) so both stay reachable. */}
      <div
        className="fixed inset-x-0 z-40 flex gap-3 border-t border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md md:hidden"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}
      >
        <Link
          href="/contractors/new"
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
        >
          <ArrowDownLeft size={18} />
          Receive
        </Link>
        <Link
          href="/payroll"
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <Send size={18} />
          Send
        </Link>
      </div>
    </>
  );
}

/** Shared elevated panel for the below-ledger widgets. Matches the reference
 * surface ramp (surface-200 + a 1px top-edge highlight) used across the page. */
function DashCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`surface-200 flex flex-col gap-4 rounded-xl border border-slate-800/50 p-6 top-edge-light ${
        className ?? ''
      }`}
    >
      {children}
    </div>
  );
}

/** Treasury balance + payroll runway. Falls back gracefully when there is no
 * treasury wallet, when Horizon is unreachable, or when no USDC line exists. */
function TreasuryCard({
  treasuryAddress,
  balanceLabel,
  unavailable,
  runwayLabel,
}: {
  treasuryAddress: string | null;
  balanceLabel: string | null;
  unavailable: boolean;
  runwayLabel: string | null;
}) {
  return (
    <DashCard>
      <div className="flex items-center gap-2">
        <Wallet size={16} className="text-indigo-400" />
        <span className="overline text-slate-300">Treasury</span>
      </div>
      {!treasuryAddress ? (
        <div className="flex flex-col gap-3">
          <p className="font-body text-sm text-slate-400">
            Connect a treasury wallet to track your balance and payroll runway.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 font-headline text-sm text-indigo-400 hover:text-indigo-300"
          >
            Connect a treasury wallet
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <div className="overline mb-1 text-slate-400">Treasury balance</div>
            {unavailable ? (
              <>
                <div className="mono text-2xl text-slate-200">-</div>
                <div className="mt-1 font-mono text-[10px] text-slate-500">Balance unavailable</div>
              </>
            ) : (
              <div className="mono text-2xl text-slate-100">{balanceLabel}</div>
            )}
          </div>
          {runwayLabel && !unavailable ? (
            <div className="border-t border-slate-800/50 pt-3">
              <div className="overline mb-1 text-slate-400">Runway</div>
              <div className="mono text-lg text-slate-200">{runwayLabel}</div>
            </div>
          ) : null}
        </div>
      )}
    </DashCard>
  );
}

/** Audit readiness: how many payments carry an on-chain proof, and whether the
 * whole ledger is re-verifiable by a third party right now. */
function ComplianceCard({ total, verified }: { total: number; verified: number }) {
  const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const pending = total - verified;
  const auditReady = total > 0 && verified === total;
  return (
    <DashCard>
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-emerald-400" />
        <span className="overline text-slate-300">Audit readiness</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="mono text-2xl text-slate-100">{verified}</span>
        <span className="font-mono text-sm text-slate-400">of {total} verified on-chain</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="mono text-lg text-slate-200">{pct}%</div>
        {total === 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            No payments yet
          </span>
        ) : auditReady ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-emerald-400">
            <Check size={12} />
            Audit-ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-amber-400">
            {pending} pending
          </span>
        )}
      </div>
      <p className="border-t border-slate-800/50 pt-3 font-body text-xs text-slate-400">
        Any third party can re-verify these proofs on-chain, no trust in the company required.
      </p>
    </DashCard>
  );
}

/** Contributors that still need attention (un-anchored / awaiting acceptance).
 * A calm "all clear" state when nothing is outstanding. */
function ActionItemsCard({
  items,
}: {
  items: { id: string; name: string; label: string }[];
}) {
  const shown = items.slice(0, 4);
  const extra = items.length - shown.length;
  return (
    <DashCard>
      <div className="flex items-center gap-2">
        <CircleAlert size={16} className="text-amber-400" />
        <span className="overline text-slate-300">Action items</span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Check size={16} />
          </span>
          <div>
            <div className="font-body text-sm text-slate-200">All clear</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Nothing needs attention
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-slate-800/50">
          {shown.map((it) => (
            <Link
              key={it.id}
              href={`/contractors/${it.id}`}
              className="group flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate font-body text-sm text-slate-200 group-hover:text-slate-50">
                  {it.name}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400/80">
                  {it.label}
                </div>
              </div>
              <ArrowRight
                size={14}
                className="shrink-0 text-slate-500 transition-colors group-hover:text-indigo-400"
              />
            </Link>
          ))}
          {extra > 0 ? (
            <Link
              href="/contractors"
              className="py-2.5 font-mono text-xs text-indigo-400 hover:text-indigo-300"
            >
              +{extra} more
            </Link>
          ) : null}
        </div>
      )}
    </DashCard>
  );
}

/** Getting-started checklist for a fresh workspace. Done steps show an emerald
 * check; the first outstanding step gets the primary call to action. */
function OnboardingChecklist({
  steps,
}: {
  steps: { label: string; hint: string; done: boolean; href: string; cta: string }[];
}) {
  const nextIdx = steps.findIndex((s) => !s.done);
  return (
    <DashCard className="lg:p-8">
      <span className="overline text-slate-300">Getting started</span>
      <p className="font-body text-sm text-slate-400">
        A few steps to your first confidential payroll. Each one is provable on-chain.
      </p>
      <ol className="mt-2 flex flex-col gap-2">
        {steps.map((s, i) => {
          const isNext = i === nextIdx;
          return (
            <li
              key={s.label}
              className={`flex items-center gap-4 rounded-lg border p-4 ${
                isNext ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-800/50'
              }`}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full border ${
                  s.done
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : isNext
                      ? 'border-indigo-500/40 text-indigo-400'
                      : 'border-slate-700 text-slate-600'
                }`}
              >
                {s.done ? <Check size={16} /> : <span className="font-mono text-xs">{i + 1}</span>}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`font-body text-sm ${
                    s.done ? 'text-slate-400 line-through' : 'text-slate-100'
                  }`}
                >
                  {s.label}
                </div>
                {!s.done ? (
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    {s.hint}
                  </div>
                ) : null}
              </div>
              {isNext ? (
                <Link
                  href={s.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded bg-indigo-600 px-4 py-2 font-headline text-sm text-white transition-colors hover:bg-indigo-500"
                >
                  {s.cta}
                  <ArrowRight size={14} />
                </Link>
              ) : s.done ? (
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                  Done
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </DashCard>
  );
}
