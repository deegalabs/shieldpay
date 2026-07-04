'use client';

import * as React from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';

/**
 * The Proof Explorer's interactive ledger. A server page loads the company's
 * recorded proofs and hands them here as plain, serializable rows; this client
 * shell owns only the search field and the client-side filter over what is
 * already loaded (proof id, recipient, or tx hash). The reading surface itself
 * is the signature DataTable with the left index rail.
 */

export type ProofType = 'Payment' | 'Proof-of-Payroll' | 'Income';

export interface ProofRow {
  /** Stable React key. */
  id: string;
  /** Truncated proof id for display (mono). */
  proofIdShort: string;
  /** Full proof id, used for search matching. */
  proofIdFull: string;
  type: ProofType;
  /** Truncated recipient / reference for display. */
  recipient: string;
  /** Full recipient value, used for search matching. */
  recipientFull: string;
  /** Whether the proof is finalized on-chain (drives the sealed vs computing look). */
  verified: boolean;
  /** Explorer tx hash, or null while the proof is still computing. */
  txHash: string | null;
  /** Truncated tx hash for display. */
  txShort: string | null;
  /** A sealed cents range (per-payment proofs), formatted by the chip. */
  range: { minCents: number; maxCents: number } | null;
  /** A disclosed aggregate label (payroll proofs prove the total, not a range). */
  disclosedLabel: string | null;
}

/** A quiet slate pill for the proof TYPE, tokens only. */
function TypeTag({ type }: { type: ProofType }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-surface-3 px-2 py-0.5 text-xs text-fg-subtle">
      {type}
    </span>
  );
}

/** The still-computing counterpart to the SealedChip: a dashed, muted pill. */
function ComputingChip() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-border bg-surface-3 px-3 py-1 text-fg-subtle">
      <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-fg-faint" />
      <span className="mono whitespace-nowrap text-xs">Computing…</span>
    </span>
  );
}

export function ProofExplorerTable({
  rows,
  explorerBase,
}: {
  rows: ProofRow[];
  explorerBase: string;
}) {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.proofIdFull.toLowerCase().includes(q) ||
        r.recipientFull.toLowerCase().includes(q) ||
        (r.txHash ? r.txHash.toLowerCase().includes(q) : false),
    );
  }, [rows, query]);

  const columns: Column<ProofRow>[] = [
    {
      key: 'proofId',
      header: 'Proof ID',
      cell: (r) => (
        <span className="proof-id text-brand-text" title={r.proofIdFull}>
          {r.proofIdShort}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (r) => <TypeTag type={r.type} />,
    },
    {
      key: 'recipient',
      header: 'Recipient',
      cell: (r) => (
        <span className="mono text-fg-strong" title={r.recipientFull}>
          {r.recipient}
        </span>
      ),
    },
    {
      key: 'range',
      header: 'Proven range',
      align: 'money',
      cell: (r) => {
        if (!r.verified) {
          return (
            <span className="inline-flex justify-end">
              <ComputingChip />
            </span>
          );
        }
        if (r.range) {
          return (
            <span className="inline-flex justify-end">
              <SealedChip range={r.range} />
            </span>
          );
        }
        // Payroll proves a disclosed aggregate total, not a sealed range.
        return <span className="mono text-fg-strong">{r.disclosedLabel}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <span className="inline-flex justify-center">
          <OnChainSeal state={r.verified ? 'verified' : 'computing'} size="md" />
        </span>
      ),
      headerClassName: 'text-center',
      className: 'text-center',
    },
    {
      key: 'tx',
      header: 'Ledger Tx',
      align: 'right',
      cell: (r) =>
        r.txHash ? (
          <a
            className="relative z-10 inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg-default"
            href={`${explorerBase}/tx/${r.txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="mono">{r.txShort}</span>
            <ArrowUpRight size={13} />
          </a>
        ) : (
          <span className="text-sm italic text-fg-faint">Pending</span>
        ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* On mobile the search pins below the app bar so it stays reachable while
          the proof cards scroll under it; on md+ it is a normal inline field. */}
      <div className="sticky top-0 z-20 -mx-6 bg-slate-950/95 px-6 py-3 backdrop-blur-md md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="relative max-w-3xl">
          <Search
            size={18}
            strokeWidth={1.75}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a proof id, tx hash, or recipient"
            aria-label="Search a proof id, tx hash, or recipient"
            className={cn(
              'mono w-full rounded-lg border border-border bg-surface-2 py-3.5 pl-12 pr-4 text-sm text-fg-default',
              'placeholder:text-fg-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
              'top-edge transition-colors',
            )}
          />
        </div>
      </div>

      {/* On md+ the ledger scrolls inside its 820px min-width. Below md the min
          width is dropped so the stacked proof cards flow full-bleed with no
          horizontal scroll (the phone-cramped table was the problem we fix). */}
      <div className="md:overflow-x-auto md:pb-2">
        <div className="md:min-w-[820px]">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            indexRail
            indexHeader="Idx"
            caption="On-chain proofs recorded for this company."
            empty={
              query.trim()
                ? 'No proofs match your search.'
                : 'No proofs recorded yet.'
            }
            mobileCard={(r) => (
              // Body only: the DataTable supplies the card chrome (surface,
              // border, rounded, padding, top-edge).
              <div className="flex flex-col gap-3">
                {/* Header: the proof id leads, the on-chain seal sits beside it. */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="overline text-fg-subtle">Proof</span>
                    <div className="proof-id mt-1 truncate text-brand-text" title={r.proofIdFull}>
                      {r.proofIdShort}
                    </div>
                  </div>
                  <OnChainSeal
                    state={r.verified ? 'verified' : 'computing'}
                    size="md"
                    className="shrink-0"
                  />
                </div>

                {/* Type + range: label left, value right, quiet hairlines. */}
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="overline text-fg-subtle">Type</span>
                  <span className="mono text-sm text-fg-strong">{r.type}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="overline text-fg-subtle">Range</span>
                  {!r.verified ? (
                    <ComputingChip />
                  ) : r.range ? (
                    <SealedChip range={r.range} size="md" />
                  ) : (
                    <span className="mono text-sm text-fg-strong">{r.disclosedLabel}</span>
                  )}
                </div>

                {/* Tap to open the proof's settlement tx on the public explorer. */}
                {r.txHash && (
                  <a
                    href={`${explorerBase}/tx/${r.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mono inline-flex items-center gap-1.5 self-start border-t border-border pt-3 text-xs text-brand-text transition-colors hover:text-brand"
                  >
                    View on-chain <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
