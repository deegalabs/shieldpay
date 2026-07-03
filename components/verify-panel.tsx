'use client';

import * as React from 'react';
import { ShieldCheck, ExternalLink, Search, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

/** Format a cents value (u64 string) as a USDC dollar figure. */
function formatUsdc(cents: string | undefined): string {
  const n = Number(cents ?? '0');
  return (n / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
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

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm text-muted">
        <ShieldCheck size={16} className="text-primary" /> Independent verification
      </div>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">
        Verify a proof on-chain, no wallet needed
      </h3>
      <p className="mt-2 text-sm text-muted">
        Read a recorded payment proof straight from the Stellar contract. No account, no signing,
        nothing to install. Try proof <span className="figure">0</span>.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          value={proofId}
          onChange={(e) => setProofId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onVerify();
          }}
          aria-label="Proof id"
          className="sm:max-w-40"
        />
        <Button onClick={onVerify} disabled={loading} variant="primary" className="sm:w-auto">
          <Search size={16} /> {loading ? 'Checking…' : 'Verify on-chain'}
        </Button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-danger-text" role="alert">
          {error}
        </p>
      )}

      {success && record && (
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between">
            <Badge variant="success">
              <ShieldCheck size={12} /> Verified on-chain
            </Badge>
            <span className="text-xs text-muted">
              Recorded at ledger {String(record.verified_at_ledger ?? '—')}
            </span>
          </div>
          <div className="mt-4 space-y-2.5 text-sm">
            <ResultRow k="Recipient (address hash)" v={truncate(record.worker_address_hash ?? '')} mono />
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-fg-subtle">Settlement transaction</span>
              {record.payment_tx_hash ? (
                <a
                  href={`${EXPLORER_BASE}/tx/${record.payment_tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="figure inline-flex items-center gap-1 font-medium text-brand-text hover:underline"
                >
                  {truncate(record.payment_tx_hash)} <ExternalLink size={13} />
                </a>
              ) : (
                <span className="text-fg-faint">—</span>
              )}
            </div>
            <ResultRow k="Amount commitment" v={truncate(record.value_commitment ?? '')} mono />
            <ResultRow
              k="Proven range"
              v={`${formatUsdc(record.range_min)} to ${formatUsdc(record.range_max)} USDC`}
              mono
              last
            />
          </div>
        </div>
      )}

      {result && !success && (
        <div className="mt-6 rounded-lg border border-border bg-surface-2 p-5 text-sm text-muted">
          No verified proof recorded at that id. Try <span className="figure">0</span> for a real
          on-chain record.
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-fg-faint">
        <Info size={13} className="mt-0.5 shrink-0" /> The exact amount stays private; only the
        commitment and the agreed range are public.
      </p>
    </Card>
  );
}

function ResultRow({
  k,
  v,
  mono,
  last,
}: {
  k: string;
  v: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center justify-between',
        last ? '' : 'border-b border-border pb-2.5',
      ].join(' ')}
    >
      <span className="text-fg-subtle">{k}</span>
      <span className={['font-medium text-fg-default', mono ? 'figure' : ''].join(' ')}>{v}</span>
    </div>
  );
}
