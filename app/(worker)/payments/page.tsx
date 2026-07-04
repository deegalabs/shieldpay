import { ShieldCheck, ArrowUpRight, FileText } from 'lucide-react';
import {
  listPayments,
  listPaymentsForWorker,
  listContractorsByAddress,
  type PaymentRow,
  type InviteView,
} from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { getSession } from '@/lib/auth/server';
import { usdRange } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfoHint } from '@/components/ui/tooltip';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { ConnectionError } from '@/components/ui/connection-error';
import { StatFigure } from '@/components/ui/stat-figure';
import { CompleteAnchor } from '@/components/complete-anchor';
import { WorkerIncomeCard } from '@/components/worker-income-card';

export const dynamic = 'force-dynamic';

function shortAddr(a: string | null): string {
  return a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || '—';
}

/**
 * Worker portal, the collaborator's own profile plus received payments and
 * their proofs. Scoped to the authenticated worker's address; a company
 * session sees all payments.
 */
export default async function WorkerPayments() {
  const session = await getSession();
  let payments: PaymentRow[] = [];
  let orgs: InviteView[] = [];
  let dbError = false;
  try {
    if (session?.role === 'worker') {
      [payments, orgs] = await Promise.all([
        listPaymentsForWorker(session.sub),
        listContractorsByAddress(session.sub),
      ]);
    } else {
      payments = await listPayments(50);
    }
  } catch {
    // Distinguish a genuine "nothing yet" from a records outage below, so the
    // worker is never shown a reassuring empty state when the read failed.
    dbError = true;
  }

  const latest = payments[0];
  const profile = orgs[0] ?? null;
  const companyName = orgs[0]?.company_name;
  const displayName = profile?.name || session?.name || 'My account';

  const columns: Array<Column<PaymentRow>> = [
    {
      key: 'reference',
      header: 'Payment',
      cell: (p) => (
        <div className="min-w-0">
          <p className="font-medium text-fg-default">{p.reference}</p>
          {p.payer_name && <p className="mt-0.5 text-xs text-fg-subtle">{p.payer_name}</p>}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'money',
      cell: (p) => (
        <span className="inline-flex justify-end">
          <SealedChip range={{ minCents: p.range_min, maxCents: p.range_max }} />
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <span className="inline-flex items-center gap-2">
          <OnChainSeal state="verified" label="Received" />
          <InfoHint>
            A mathematical proof, checked inside a Stellar smart contract, confirms this payment was
            within your agreed range, without revealing the exact amount.
          </InfoHint>
          {/* Keep the amount referenced by screen readers even where it is masked. */}
          <span className="sr-only">
            Within {usdRange(p.range_min, p.range_max)} USDC, verified on-chain.
          </span>
        </span>
      ),
    },
    {
      key: 'documents',
      header: 'Documents',
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="sm">
            <a href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">
              <FileText size={13} /> Receipt
            </a>
          </Button>
          {p.settlement_tx_hash && (
            <Button asChild variant="ghost" size="sm">
              <a href={`${EXPLORER_BASE}/tx/${p.settlement_tx_hash}`} target="_blank" rel="noreferrer">
                Settlement <ArrowUpRight size={13} />
              </a>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <a href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
              Proof <ArrowUpRight size={13} />
            </a>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <p className="overline">Contributor portal</p>
        <h1 className="font-headline text-headline-lg-mobile tracking-tight text-fg-default md:text-headline-lg">
          Hello, {displayName}
        </h1>
        <p className="text-sm text-fg-subtle">
          {dbError
            ? 'We could not load your payments just now.'
            : latest
              ? `Last received: ${latest.reference}`
              : 'Your received payments will appear here.'}
        </p>
        {profile && (
          <p className="text-sm text-fg-subtle">
            Your wallet:{' '}
            <span className="figure text-fg-strong">{shortAddr(profile.stellar_address)}</span>
          </p>
        )}
      </header>

      {!dbError && payments.length > 0 && (
        <StatFigure
          variant="secondary"
          label="Payments received"
          value={String(payments.length)}
          sublabel="Each one carries an on-chain proof you can share."
        />
      )}

      {orgs.length > 0 && (
        <section className="space-y-3">
          <h2 className="overline">
            {orgs.length > 1 ? 'Your organizations' : 'Your organization'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {orgs.map((o) => (
              <Card key={o.id} className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-fg-default">{o.company_name}</p>
                  {o.anchored ? (
                    <Badge variant="success">
                      <ShieldCheck size={12} /> Anchored
                    </Badge>
                  ) : (
                    <Badge variant="warning">Pending anchor</Badge>
                  )}
                </div>
                {o.role && <Field label="Role" value={o.role} />}
                <Field
                  label="Agreed range"
                  value={`${usdRange(o.range_min, o.range_max)} USDC/mo`}
                  mono
                />
                {!o.anchored && (
                  <>
                    <p className="text-xs text-fg-subtle">
                      Finish anchoring your identity on-chain so this organization can pay you.
                    </p>
                    <CompleteAnchor
                      contractorId={String(o.id)}
                      workerAddress={o.stellar_address || ''}
                      companyAddress={
                        /^G[A-Z2-7]{55}$/.test(o.company_treasury || '')
                          ? o.company_treasury!
                          : process.env.COMPANY_PUBLIC_KEY || ''
                      }
                      anchorContractId={process.env.ANCHOR_REGISTRY_CONTRACT_ID || ''}
                      cpfHash={o.cpf_hash || ''}
                      rangeMinCents={o.range_min}
                      rangeMaxCents={o.range_max}
                    />
                  </>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {session?.role === 'worker' && <WorkerIncomeCard companyName={companyName} />}

      <section className="space-y-3">
        <h2 className="overline">Payment history</h2>
        {dbError ? (
          <ConnectionError message="Your payments are safe on-chain. Please try again in a moment." />
        ) : (
          <>
            <div className="md:overflow-x-auto md:pb-2">
              <DataTable
                columns={columns}
                rows={payments}
                rowKey={(p) => p.id}
                indexRail
                indexHeader="Idx"
                caption="Your received payments and their on-chain proofs."
                empty="No payments received yet."
                mobileCard={(p) => (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-fg-default">{p.reference}</div>
                        {p.payer_name && (
                          <div className="mono mt-0.5 truncate text-[11px] text-fg-faint">
                            {p.payer_name}
                          </div>
                        )}
                      </div>
                      <OnChainSeal state="verified" label="Received" />
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                      <span className="overline text-fg-faint">Amount</span>
                      <SealedChip range={{ minCents: p.range_min, maxCents: p.range_max }} />
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <a href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">
                          <FileText size={13} /> Receipt
                        </a>
                      </Button>
                      {p.settlement_tx_hash && (
                        <Button asChild variant="ghost" size="sm">
                          <a
                            href={`${EXPLORER_BASE}/tx/${p.settlement_tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Settlement <ArrowUpRight size={13} />
                          </a>
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="sm">
                        <a href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
                          Proof <ArrowUpRight size={13} />
                        </a>
                      </Button>
                    </div>
                    <span className="sr-only">
                      Within {usdRange(p.range_min, p.range_max)} USDC, verified on-chain.
                    </span>
                  </div>
                )}
              />
            </div>
            {payments.length > 0 && (
              <p className="text-xs text-fg-subtle">
                Tip: download each receipt PDF for your tax return. Every receipt can be
                independently re-verified on the public blockchain explorer.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="overline">{label}</p>
      <p className={`mt-1 text-sm ${mono ? 'figure text-fg-strong' : 'font-medium text-fg-strong'}`}>
        {value}
      </p>
    </div>
  );
}
