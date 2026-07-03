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
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { MaskedAmount } from '@/components/ui/masked-amount';
import { ConnectionError } from '@/components/ui/connection-error';

export const dynamic = 'force-dynamic';

const OVERLINE = 'text-xs font-[550] uppercase tracking-[0.06em] text-fg-subtle';

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
      cell: (p) => <span className="font-medium text-fg-strong">{p.worker_name}</span>,
    },
    {
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
      header: 'On-chain',
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
            className="inline-flex items-center gap-1 text-brand-text hover:underline"
            href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
            target="_blank"
            rel="noreferrer"
          >
            Proof <ArrowUpRight size={13} />
          </a>
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
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg-default"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={OVERLINE}>Payroll run</p>
            <p className="figure-hero mt-1.5 text-3xl font-semibold">{usd(Number(run.total_cents))} USDC</p>
            <p className="mt-1 text-sm text-fg-subtle">{run.payment_count} payments · total proven</p>
          </div>
          <Badge variant="success">
            <ShieldCheck size={12} /> Verified on-chain
          </Badge>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-5 sm:grid-cols-3">
          <div className="space-y-1">
            <dt className={OVERLINE}>Reference</dt>
            <dd className="figure text-sm text-fg-strong">{run.reference}</dd>
          </div>
          <div className="space-y-1">
            <dt className={OVERLINE}>Payments</dt>
            <dd className="figure text-sm text-fg-strong">{run.payment_count}</dd>
          </div>
          {run.proof_id && (
            <div className="space-y-1">
              <dt className={OVERLINE}>Proof ID</dt>
              <dd className="proof-id text-sm text-fg-strong">{run.proof_id}</dd>
            </div>
          )}
        </dl>

        <p className="mt-5 flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/40 p-3 text-xs text-fg-subtle">
          <Lock size={12} /> Each payment posts a real, recipient-visible on-chain settlement; the
          exact amount stays private (committed, never in clear). The total above is yours, an
          authorized auditor can verify it and each amount without it ever being public.
        </p>
      </Card>

      {run.proof_verified && run.proof_tx_hash && (
        <Card className="card-primary p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <ShieldCheck size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-fg-default">Proof-of-Payroll · the whole run, proven at once</p>
              <p className="mt-1 text-sm text-fg-subtle">
                A single on-chain proof, verified on-chain in a Stellar smart contract, attests
                that this run&apos;s total is exactly{' '}
                <span className="figure">{usd(Number(run.total_cents))} USDC</span> and that every
                payment is within its agreed range, without revealing a single salary. It is
                proof-of-reserves, for payroll.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <Badge variant="brand">
                  <ShieldCheck size={12} /> Total proven, salaries hidden
                </Badge>
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

      <section className="space-y-3">
        <h2 className={OVERLINE}>Payments in this run</h2>
        {readFailed ? (
          <ConnectionError message="The run is safe. We just could not load its payment lines right now. Please refresh in a moment." />
        ) : (
          <Card className="overflow-hidden">
            <DataTable
              columns={columns}
              rows={payments}
              rowKey={(p) => p.id}
              caption="Every payment in this run, each amount verified and kept private."
              empty="No payment lines recorded for this run yet."
            />
          </Card>
        )}
      </section>
    </div>
  );
}
