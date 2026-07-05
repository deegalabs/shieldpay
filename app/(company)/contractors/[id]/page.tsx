import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import {
  getCompanyByOwner,
  getContractor,
  listPaymentsForWorker,
  type PaymentRow,
} from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { truncateKey } from '@/lib/utils';
import { ConnectionError } from '@/components/ui/connection-error';
import { BackLink } from '@/components/ui/back-link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { EditContractorSheet } from '@/components/edit-contractor-sheet';
import { ContractorActions } from '@/components/contractor-actions';
import { ContractorDetailTabs } from '@/components/contractor-detail-tabs';
import { ProofOfIncomeCard } from '@/components/proof-of-income-card';

export const dynamic = 'force-dynamic';

/** "Oct 24, 2026" settle date, mono in the ledger. */
function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

/** Short mono hash for the proof cell: 033d..f89c. */
function shortHash(hash: string): string {
  if (hash.length <= 8) return hash;
  return `${hash.slice(0, 4)}..${hash.slice(-4)}`;
}

export default async function ContractorDetail({ params }: { params: { id: string } }) {
  const session = await getSession();
  const company = session ? await getCompanyByOwner(session.sub) : null;
  const contractor = company ? await getContractor(params.id, company.id) : null;

  if (!contractor) notFound();

  let payments: PaymentRow[] = [];
  let paymentsError = false;
  try {
    if (contractor.stellar_address) {
      payments = await listPaymentsForWorker(contractor.stellar_address);
    }
  } catch {
    paymentsError = true;
  }

  const range = { minCents: contractor.range_min, maxCents: contractor.range_max };

  const paymentColumns: Array<Column<PaymentRow>> = [
    {
      key: 'reference',
      header: 'Reference',
      cell: (p) => (
        <div className="flex flex-col">
          <span className="font-medium text-fg-strong">{p.reference}</span>
          <span className="mono text-[10px] text-fg-faint">{dateShort(p.created_at)}</span>
        </div>
      ),
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
      key: 'links',
      header: <span className="sr-only">Links</span>,
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-4">
          <a
            className="mono inline-flex items-center gap-1 text-xs text-fg-subtle hover:text-brand-text"
            href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
            target="_blank"
            rel="noreferrer"
          >
            Proof <ArrowUpRight size={13} />
          </a>
          <a
            className="mono text-xs text-fg-strong hover:text-brand-text"
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
    <div className="mx-auto max-w-3xl space-y-10">
      <BackLink href="/contractors" label="Contributors" />

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <p className="overline">Recipient</p>
          <h1 className="font-headline text-headline-lg-mobile tracking-tight text-fg-default md:text-headline-lg">
            {contractor.name}
          </h1>
          {contractor.stellar_address && (
            <p className="mono break-all text-xs text-fg-faint">{contractor.stellar_address}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          {contractor.anchored ? (
            <OnChainSeal state="verified" size="md" label="Identity anchored" />
          ) : (
            <OnChainSeal state="computing" size="md" label="Not anchored" />
          )}
          <EditContractorSheet
            contractorId={contractor.public_id}
            defaults={{
              name: contractor.name,
              stellar_address: contractor.stellar_address ?? '',
              minUsdc: contractor.range_min / 100,
              maxUsdc: contractor.range_max / 100,
            }}
            redirectTo={`/contractors/${contractor.public_id}`}
          />
        </div>
      </header>

      <ContractorDetailTabs
        details={
          <div className="card-primary flex flex-wrap items-center justify-between gap-4">
            <div aria-hidden className="ambient-wash pointer-events-none absolute inset-0" />
            <div className="relative z-10 space-y-3">
              <p className="overline">Agreed range</p>
              <SealedChip range={range} size="md" />
            </div>
            <div className="relative z-10">
              <ContractorActions
                id={contractor.public_id}
                anchored={contractor.anchored}
                demo={session?.method === 'demo'}
              />
            </div>
          </div>
        }
        proof={
          contractor.stellar_address ? (
            <ProofOfIncomeCard
              workerAddress={contractor.stellar_address}
              workerName={contractor.name}
              defaultMinCents={contractor.range_min}
              defaultMaxCents={contractor.range_max}
            />
          ) : null
        }
        payments={
          paymentsError ? (
            <ConnectionError
              title="We cannot reach this contributor's payments right now."
              message="Please try again in a moment."
            />
          ) : (
            <div className="md:overflow-x-auto md:pb-2">
              <DataTable
                columns={paymentColumns}
                rows={payments}
                rowKey={(p) => p.id}
                indexRail
                caption="Verified payments to this contributor."
                empty="No payments to this contributor yet."
                mobileCard={(p) => (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-fg-strong">{p.reference}</div>
                        <div className="mono mt-0.5 truncate text-[11px] text-fg-faint">
                          {dateShort(p.created_at)}
                        </div>
                      </div>
                      <OnChainSeal
                        state={p.verified ? 'verified' : 'computing'}
                        label={p.verified ? 'Verified' : 'Computing'}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                      <span className="overline text-fg-faint">Agreed range</span>
                      <SealedChip range={{ minCents: p.range_min, maxCents: p.range_max }} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="mono text-[11px] text-fg-faint">
                        {p.verified && p.tx_hash
                          ? `#${p.proof_id} | ${shortHash(p.tx_hash)}`
                          : 'Generating…'}
                      </span>
                      <span className="flex gap-4">
                        <a
                          className="mono inline-flex items-center gap-1 text-xs text-fg-subtle hover:text-brand-text"
                          href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Proof <ArrowUpRight size={13} />
                        </a>
                        <a
                          className="mono text-xs text-fg-strong hover:text-brand-text"
                          href={`/api/receipt?id=${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Receipt
                        </a>
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>
          )
        }
      />
    </div>
  );
}
