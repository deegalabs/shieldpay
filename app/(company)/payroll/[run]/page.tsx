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
import { usd, usdRange } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PayrollRunPage({ params }: { params: { run: string } }) {
  const session = await getSession();
  const company = session ? await getCompanyByOwner(session.sub) : null;
  const run = company ? await getPayrollRun(params.run, company.id) : null;

  if (!run) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="font-medium">Run not found</p>
        <Link href="/payroll" className="mt-2 inline-block text-accent hover:underline">Back to payroll</Link>
      </div>
    );
  }

  let payments: PaymentRow[] = [];
  try {
    payments = await listPaymentsForRun(run.id);
  } catch {
    /* ignore */
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Payroll run · {run.reference}</p>
            <p className="figure-hero mt-1 text-3xl font-bold">{usd(Number(run.total_cents))} USDC</p>
            <p className="text-sm text-muted">{run.payment_count} payments · total proven</p>
          </div>
          <Badge variant="success"><ShieldCheck size={12} /> Verified on-chain</Badge>
        </div>
        <p className="mt-4 flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/40 p-3 text-xs text-muted">
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
              <p className="font-semibold">Proof-of-Payroll · the whole run, proven at once</p>
              <p className="mt-1 text-sm text-fg-subtle">
                A single zero-knowledge proof, verified on-chain in a Stellar smart contract, attests
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

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Payments in this run</h2>
        <Card className="divide-y divide-border overflow-hidden">
          {payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-[8rem]">
                <p className="font-medium">{p.worker_name}</p>
                <p className="text-xs text-muted">amount: private</p>
              </div>
              <span className="text-sm text-muted">range <span className="figure">{usdRange(p.range_min, p.range_max)}</span></span>
              <Badge variant="success"><ShieldCheck size={12} /> Verified</Badge>
              <div className="flex gap-3 text-sm">
                {p.settlement_tx_hash && (
                  <a className="inline-flex items-center gap-1 text-accent hover:underline" href={`${EXPLORER_BASE}/tx/${p.settlement_tx_hash}`} target="_blank" rel="noreferrer">
                    Settlement <ArrowUpRight size={13} />
                  </a>
                )}
                <a className="inline-flex items-center gap-1 text-accent hover:underline" href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
                  Proof <ArrowUpRight size={13} />
                </a>
                <a className="text-foreground hover:underline" href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">
                  Receipt
                </a>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
