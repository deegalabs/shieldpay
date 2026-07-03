'use client';

import * as React from 'react';
import { ShieldCheck, Search, Info, Fingerprint, UserCheck, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InfoHint } from '@/components/ui/tooltip';

interface CredentialRecord {
  employer_ax?: string;
  employer_ay?: string;
  worker_id?: string;
  range_min?: string | number;
  range_max?: string | number;
  verified_at_ledger?: string | number;
}

interface VerifyResult {
  presented: boolean;
  record: CredentialRecord | null;
}

/** Shorten a long hex/decimal string for display without losing head and tail. */
function truncate(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Format a cents value (string/number) as a USDC dollar figure. */
function formatUsdc(cents: string | number | undefined): string {
  const n = Number(cents ?? '0');
  return (n / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

/**
 * Public, wallet-free proof-of-income verifier. Reads the credential straight
 * from the Stellar contract via a read-only simulate, so anyone (a landlord, a
 * lender, a marketplace) can confirm the headline claim without an account. No
 * monthly amount is ever shown, only the agreed range and the employer that
 * attested it.
 */
export function VerifyIncomePanel() {
  const [nullifier, setNullifier] = React.useState('');
  const [credentialId, setCredentialId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<VerifyResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const verify = React.useCallback(async (n: string, id: string | null) => {
    const value = n.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(value)) {
      setError('Enter a valid credential reference (a 64-character code).');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/income/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nullifier: value, ...(id ? { id } : {}) }),
      });
      if (!res.ok) {
        setError('Could not check this credential. Please try again.');
        return;
      }
      setResult((await res.json()) as VerifyResult);
    } catch {
      setError('Could not reach the network. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Prefill from the shareable link (/verify-income?n=<nullifier>&id=<id>) and
  // verify automatically so a recipient of the link sees the result at once.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get('n') ?? '';
    const id = params.get('id');
    if (n) {
      setNullifier(n);
      setCredentialId(id);
      void verify(n, id);
    }
  }, [verify]);

  const record = result?.record ?? null;
  const success = result?.presented === true;

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm text-muted">
        <ShieldCheck size={16} className="text-primary" /> Independent verification
      </div>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">
        Verify a proof of income, no wallet needed
      </h3>
      <p className="mt-2 text-sm text-muted">
        Paste a credential reference (or open a shared link) to confirm it straight from the Stellar
        contract. No account, no signing, nothing to install.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Input
          value={nullifier}
          onChange={(e) => setNullifier(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') verify(nullifier, credentialId);
          }}
          placeholder="Credential reference"
          aria-label="Credential reference"
          className="figure"
        />
        <Button
          onClick={() => verify(nullifier, credentialId)}
          disabled={loading}
          variant="primary"
          className="sm:w-auto"
        >
          <Search size={16} /> {loading ? 'Checking…' : 'Verify on-chain'}
        </Button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-danger-text" role="alert">
          {error}
        </p>
      )}

      {success && (
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between">
            <Badge variant="success">
              <ShieldCheck size={12} /> Verified on-chain
            </Badge>
            {record?.verified_at_ledger != null && (
              <span className="text-xs text-muted">
                Recorded at ledger {String(record.verified_at_ledger)}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm text-fg-default">
            This income credential is genuine. It was verified and recorded on the Stellar network.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Claim icon={<Award size={12} />}>Employer-attested</Claim>
            <Claim icon={<UserCheck size={12} />}>Recipient-bound</Claim>
            <Claim icon={<Fingerprint size={12} />}>Amount-private</Claim>
          </div>

          {record && (
            <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
              <ResultRow
                k="Proven income range"
                v={`${formatUsdc(record.range_min)} to ${formatUsdc(record.range_max)} USDC`}
                mono
              />
              <ResultRow k="Attesting employer" v={truncate(record.employer_ax ?? '')} mono />
              <ResultRow k="Recipient reference" v={truncate(record.worker_id ?? '')} mono last />
            </div>
          )}

          {!record && (
            <p className="mt-4 flex items-start gap-2 text-xs text-fg-faint">
              <Info size={13} className="mt-0.5 shrink-0" /> Open the full shared link to also see the
              proven range and the attesting employer.
            </p>
          )}
        </div>
      )}

      {result && !success && (
        <div className="mt-6 rounded-lg border border-border bg-surface-2 p-5 text-sm text-muted">
          No income credential found for that reference. Check the code, or ask the issuer for a fresh
          link.
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-fg-faint">
        <Fingerprint size={13} className="mt-0.5 shrink-0" /> The exact monthly amounts stay private.
        Only the agreed range and the employer that attested it are shown.{' '}
        <span className="inline-flex">
          <InfoHint>
            The credential is verified on-chain: it confirms the income falls within the range
            without revealing any single payment.
          </InfoHint>
        </span>
      </p>
    </Card>
  );
}

function Claim({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-fg-subtle ring-1 ring-inset ring-border">
      {icon}
      {children}
    </span>
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
      className={['flex items-center justify-between', last ? '' : 'border-b border-border pb-2.5'].join(
        ' ',
      )}
    >
      <span className="text-fg-subtle">{k}</span>
      <span className={['font-medium text-fg-default', mono ? 'figure' : ''].join(' ')}>{v}</span>
    </div>
  );
}
