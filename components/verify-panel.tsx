'use client';

import * as React from 'react';
import { ExternalLink, Search, KeyRound, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { SealedChip } from '@/components/ui/sealed-chip';
import { EXPLORER_BASE } from '@/lib/constants';

interface ProofRecord {
  worker_address_hash?: string;
  payment_tx_hash?: string;
  value_commitment?: string;
  range_min?: string;
  range_max?: string;
  verified_at_ledger?: string | number;
}

interface VerifyResult {
  found: boolean;
  verified: boolean;
  record: ProofRecord | null;
}

/** Shorten a long hex string for display without losing the head and tail. */
function truncate(hex: string, head = 8, tail = 6): string {
  if (hex.length <= head + tail + 1) return hex;
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

/**
 * Public, wallet-free verifier. Reads a recorded proof straight from the Stellar
 * contract via a read-only simulate, so anyone can confirm the headline claim
 * without an account. The exact amount is never shown, only the commitment and
 * the agreed range.
 */
export function VerifyPanel() {
  const [proofId, setProofId] = React.useState('0');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<VerifyResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onVerify() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/verify-onchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId: proofId.trim() }),
      });
      if (!res.ok) {
        setError('Enter a valid proof id (a whole number, 0 or greater).');
        return;
      }
      setResult((await res.json()) as VerifyResult);
    } catch {
      setError('Could not reach the network. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const record = result?.record;
  const success = result?.found && result?.verified;
  const range =
    record?.range_min != null && record?.range_max != null
      ? { minCents: Number(record.range_min), maxCents: Number(record.range_max) }
      : null;

  return (
    <Card className="overflow-hidden p-0 shadow-edge">
      {/* Desktop / tablet layout (md and up). Logic untouched. */}
      <div className="hidden md:block">
      <div className="border-b border-border bg-surface-2 p-6 sm:p-8">
        <p className="overline text-brand-text">Independent verification</p>
        <h3 className="mt-3 font-headline text-2xl font-semibold tracking-tight text-fg-default">
          Don&apos;t trust us. Check the chain.
        </h3>
        <p className="mt-2 text-sm text-fg-subtle">
          Read a recorded payment proof straight from the Stellar network. No account, no signing,
          nothing to install. Try proof <span className="figure text-fg-strong">0</span>.
        </p>

        <label htmlFor="proof-id" className="overline mt-6 block">
          Proof reference
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <KeyRound
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint"
              aria-hidden
            />
            <Input
              id="proof-id"
              type="number"
              min={0}
              inputMode="numeric"
              value={proofId}
              onChange={(e) => setProofId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onVerify();
              }}
              aria-label="Proof id"
              className="figure h-12 pl-11"
            />
          </div>
          <Button
            onClick={onVerify}
            disabled={loading}
            variant="primary"
            className="h-12 sm:w-auto"
          >
            <Search size={16} /> {loading ? 'Checking…' : 'Verify on-chain'}
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-danger-text" role="alert">
            {error}
          </p>
        )}
      </div>

      {success && record && (
        <div className="animate-reveal p-6 sm:p-8" role="status" aria-live="polite">
          <div className="flex items-center gap-4 border-b border-border pb-5">
            <OnChainSeal state="verified" size="md" />
            <div>
              <p className="font-headline text-lg font-semibold tracking-tight text-fg-default">
                Verified on-chain
              </p>
              <p className="text-sm font-medium text-verified-text">Settlement confirmed</p>
            </div>
            <span className="ml-auto overline shrink-0">
              Ledger{' '}
              <span className="figure normal-case tracking-normal text-fg-subtle">
                {String(record.verified_at_ledger ?? '—')}
              </span>
            </span>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <FieldBox label="Recipient (address hash)" value={truncate(record.worker_address_hash ?? '')} />
            <FieldBox
              label="Settlement transaction"
              value={record.payment_tx_hash ? truncate(record.payment_tx_hash) : '—'}
              href={record.payment_tx_hash ? `${EXPLORER_BASE}/tx/${record.payment_tx_hash}` : undefined}
            />
            <FieldBox label="Amount commitment" value={truncate(record.value_commitment ?? '')} />
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="overline">Proven range</p>
              <div className="mt-2">
                {range ? (
                  <SealedChip range={range} size="md" />
                ) : (
                  <span className="text-fg-faint">—</span>
                )}
              </div>
            </div>
          </dl>
        </div>
      )}

      {result && !success && (
        <div className="p-6 text-sm text-fg-subtle sm:p-8">
          No verified proof recorded at that id. Try{' '}
          <span className="figure text-fg-strong">0</span> for a real on-chain record.
        </div>
      )}

      <p className="flex items-start gap-2 border-t border-border bg-surface-2 px-6 py-4 text-xs text-fg-faint sm:px-8">
        <Info size={13} className="mt-0.5 shrink-0" /> The exact amount stays private; only the proof
        that it falls within the agreed range is public.
      </p>
      </div>

      {/* Mobile layout (below md). Same state, same handler, same result object. */}
      <div className="md:hidden">
        <div className="border-b border-border bg-surface-2 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0 text-brand-text" aria-hidden />
            <p className="overline text-brand-text">Independent verification</p>
          </div>
          <h3 className="mt-2 font-headline text-xl font-semibold tracking-tight text-fg-default">
            Verify Proof
          </h3>
          <p className="mt-2 text-sm text-fg-subtle">
            Read a recorded payment proof straight from the Stellar network. No account, nothing to
            install. Try proof <span className="figure text-fg-strong">0</span>.
          </p>

          <label htmlFor="proof-id-mobile" className="overline mt-5 block">
            Proof reference
          </label>
          <div className="relative mt-2">
            <KeyRound
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint"
              aria-hidden
            />
            <Input
              id="proof-id-mobile"
              type="number"
              min={0}
              inputMode="numeric"
              value={proofId}
              onChange={(e) => setProofId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onVerify();
              }}
              aria-label="Proof id"
              className="figure h-12 pl-11"
            />
          </div>
          <Button
            onClick={onVerify}
            disabled={loading}
            variant="primary"
            className="mt-3 h-12 w-full"
          >
            <Search size={16} /> {loading ? 'Checking…' : 'Verify on Ledger'}
          </Button>

          {error && (
            <p className="mt-4 text-sm text-danger-text" role="alert">
              {error}
            </p>
          )}
        </div>

        {success && record && (
          <div className="animate-reveal p-5" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <OnChainSeal state="verified" size="md" />
              <div>
                <p className="overline text-verified-text">Verified on-chain</p>
                <p className="text-sm text-fg-subtle">
                  Settlement confirmed
                  <span className="text-fg-faint">
                    {' · ledger '}
                    <span className="figure">{String(record.verified_at_ledger ?? '—')}</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface top-edge">
              <MobileRow label="Origin (recipient hash)">
                <span className="hash font-medium text-fg-default">
                  {truncate(record.worker_address_hash ?? '')}
                </span>
              </MobileRow>
              <MobileRow label="Destination (settlement tx)">
                {record.payment_tx_hash ? (
                  <a
                    href={`${EXPLORER_BASE}/tx/${record.payment_tx_hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hash inline-flex items-center gap-1 font-medium text-brand-text hover:underline"
                  >
                    {truncate(record.payment_tx_hash)}{' '}
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ) : (
                  <span className="hash text-fg-faint">—</span>
                )}
              </MobileRow>
              <MobileRow label="Settled amount">
                {range ? (
                  <SealedChip range={range} size="md" className="self-start" />
                ) : (
                  <span className="hash text-fg-faint">—</span>
                )}
              </MobileRow>
              <MobileRow label="Zero-knowledge proof">
                <span className="hash break-all font-medium text-verified-text">
                  VALID · #{proofId.trim()}
                </span>
              </MobileRow>
            </div>
          </div>
        )}

        {result && !success && (
          <div className="p-5 text-sm text-fg-subtle">
            No verified proof recorded at that id. Try{' '}
            <span className="figure text-fg-strong">0</span> for a real on-chain record.
          </div>
        )}

        <p className="flex items-start gap-2 border-t border-border bg-surface-2 px-5 py-4 text-xs text-fg-faint">
          <Info size={13} className="mt-0.5 shrink-0" /> The exact amount stays private; only the
          proof that it falls within the agreed range is public.
        </p>
      </div>
    </Card>
  );
}

function MobileRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border p-4 last:border-b-0">
      <span className="overline">{label}</span>
      {children}
    </div>
  );
}

function FieldBox({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="overline">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="hash mt-1.5 inline-flex items-center gap-1 font-medium text-brand-text hover:underline"
        >
          {value} <ExternalLink size={12} className="shrink-0" />
        </a>
      ) : (
        <p className="hash mt-1.5 truncate font-medium text-fg-default">{value}</p>
      )}
    </div>
  );
}
