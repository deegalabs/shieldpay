import Link from 'next/link';
import { ShieldCheck, ArrowUpRight, Lock, ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import {
  getCompanyByOwner,
  getPayrollRun,
  listPaymentsForRun,
  type PaymentRow,
} from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { usd } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { ConnectionError } from '@/components/ui/connection-error';

export const dynamic = 'force-dynamic';

const OVERLINE = 'overline';

// Short, mono wallet handle for the ledger identity cell.
function shortAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 5)}…${addr.slice(-4)}` : addr;
}
// Short hash for the proof `#id | hash` cell.
function shortHash(hash: string): string {
  return hash.length > 10 ? `${hash.slice(0, 4)}…${hash.slice(-4)}` : hash;
}

export default async function PayrollRunPage({ params }: { params: { run: string } }) {
  const session = await getSession();
  const company = session ? await getCompanyByOwner(session.sub) : null;
  const run = company ? await getPayrollRun(params.run, company.id) : null;

  if (!run) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="font-medium text-fg-strong">Run not found</p>
        <Link href="/payroll" className="mt-2 inline-block text-brand-text hover:underline">
          Back to payroll
        </Link>
      </div>
    );
  }

  let payments: PaymentRow[] = [];
  let readFailed = false;
  try {
    payments = await listPaymentsForRun(run.id);
  } catch (e) {
    // Do not swallow a DB-read failure into a success-looking empty list. The run
    // itself already settled; only the line read failed.
    console.error('Failed to load payments for run', e);
    readFailed = true;
  }

  const columns: Array<Column<PaymentRow>> = [
    {
      header: 'Contributor',
      cell: (p) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-fg-strong">{p.worker_name}</div>
          <div className="mono mt-0.5 truncate text-xs text-fg-faint">{shortAddr(p.worker_address)}</div>
        </div>
      ),
    },
    {
      header: 'Agreed range',
      cell: (p) => <SealedChip range={{ minCents: p.range_min, maxCents: p.range_max }} />,
    },
    {
      header: 'Proof',
      cell: (p) => (
        <a
          className="proof-id inline-flex items-center gap-1.5 text-xs text-fg-subtle transition-colors hover:text-brand-text"
          href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
          target="_blank"
          rel="noreferrer"
        >
          #{p.proof_id} <span className="text-fg-faint">|</span> {shortHash(p.tx_hash)}
        </a>
      ),
    },
    {
      header: 'On-chain',
      className: 'text-center',
      headerClassName: 'text-center',
      cell: (p) => (
        <span className="inline-flex justify-center">
          <OnChainSeal state={p.verified ? 'verified' : 'computing'} />
        </span>
      ),
    },
    {
      header: '',
      align: 'right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-3 text-sm">
          {p.settlement_tx_hash && (
            <a
              className="inline-flex items-center gap-1 text-brand-text hover:underline"
              href={`${EXPLORER_BASE}/tx/${p.settlement_tx_hash}`}
              target="_blank"
              rel="noreferrer"
            >
              Settlement <ArrowUpRight size={13} />
            </a>
          )}
          <a
            className="text-fg-strong hover:underline"
            href={`/api/receipt?id=${p.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Receipt
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg-default"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Run header: reference + settled seal + the total as the lead figure. */}
      <Card className="relative overflow-hidden p-6">
        <div
          aria-hidden
          className="absolute left-0 top-0 h-px w-16 bg-gradient-to-r from-brand/50 to-transparent"
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className={`${OVERLINE} tracking-[0.2em]`}>Payroll Run</span>
            <h1 className="mt-2 font-headline text-3xl font-bold tracking-tight text-fg-default md:text-4xl">
              {run.reference}
            </h1>
          </div>
          <OnChainSeal state="verified" label="Settled" size="md" />
        </div>

        <div className="relative mt-6">
          <div
            aria-hidden
            className="absolute left-0 top-4 -z-10 h-20 w-64 rounded-full bg-brand/10 blur-[60px]"
          />
          <span className={OVERLINE}>Total proven</span>
          <p className="mono mt-2 text-4xl font-light tracking-tight text-fg-default tabular-nums md:text-5xl">
            {usd(Number(run.total_cents))} <span className="ml-2 text-2xl text-fg-subtle">USDC</span>
          </p>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-6 sm:grid-cols-3">
          <div className="space-y-1">
            <dt className={OVERLINE}>Payments</dt>
            <dd className="mono text-sm text-fg-strong">{run.payment_count}</dd>
          </div>
          {run.proof_id && (
            <div className="space-y-1">
              <dt className={OVERLINE}>Proof ID</dt>
              <dd className="proof-id text-sm text-fg-strong">{run.proof_id}</dd>
            </div>
          )}
          <div className="space-y-1">
            <dt className={OVERLINE}>Reference</dt>
            <dd className="mono text-sm text-fg-strong">{run.reference}</dd>
          </div>
        </dl>

        <p className="mt-6 flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/40 p-3 text-xs text-fg-subtle">
          <Lock size={12} className="shrink-0" /> Each payment posts a real, recipient-visible on-chain
          settlement; the exact amount stays private (committed, never in clear). The total above is
          yours, an authorized auditor can verify it and each amount without it ever being public.
        </p>
      </Card>

      {/* Aggregate Proof-of-Payroll: the whole run, proven at once. */}
      {run.proof_verified && run.proof_tx_hash && (
        <Card className="card-primary p-6">
          <div className="flex items-start gap-3">
            <OnChainSeal state="verified" size="md" className="mt-0.5" />
            <div className="min-w-0">
              <p className="font-headline font-semibold text-fg-default">
                Proof-of-Payroll · the whole run, proven at once
              </p>
              <p className="mt-1 text-sm text-fg-subtle">
                A single on-chain proof, verified on-chain in a Stellar smart contract, attests that
                this run&apos;s total is exactly{' '}
                <span className="mono">{usd(Number(run.total_cents))} USDC</span> and that every
                payment is within its agreed range, without revealing a single salary. It is
                proof-of-reserves, for payroll.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-text">
                  <ShieldCheck size={12} /> Total proven, salaries hidden
                </span>
                <a
                  className="proof-id inline-flex items-center gap-1 text-brand-text hover:underline"
                  href={`${EXPLORER_BASE}/tx/${run.proof_tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View proof on-chain <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Per-line Contributor Ledger. */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between px-1">
          <h2 className={OVERLINE}>Contributor Ledger</h2>
          <span className="mono rounded border border-border px-2 py-1 text-xs text-fg-subtle">
            USDC NETWORK
          </span>
        </div>
        {readFailed ? (
          <ConnectionError message="The run is safe. We just could not load its payment lines right now. Please refresh in a moment." />
        ) : (
          <Card className="overflow-hidden p-0">
            <DataTable
              columns={columns}
              rows={payments}
              rowKey={(p) => p.id}
              indexRail
              caption="Every payment in this run, each amount verified and kept private."
              empty="No payment lines recorded for this run yet."
            />
          </Card>
        )}
      </section>
    </div>
  );
}
