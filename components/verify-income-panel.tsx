'use client';

import * as React from 'react';
import { Search, KeyRound, Fingerprint, UserCheck, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { SealedChip } from '@/components/ui/sealed-chip';
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
  const hasRange = record?.range_min != null && record?.range_max != null;

  return (
    <Card className="overflow-hidden p-0 shadow-edge">
      <div className="border-b border-border bg-surface-2 p-6 sm:p-8">
        <label htmlFor="credential-ref" className="overline block">
          Credential reference
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <KeyRound
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint"
              aria-hidden
            />
            <Input
              id="credential-ref"
              value={nullifier}
              onChange={(e) => setNullifier(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') verify(nullifier, credentialId);
              }}
              placeholder="SP-CRED-XXXX-YYYY"
              aria-label="Credential reference"
              className="figure h-12 pl-11"
            />
          </div>
          <Button
            onClick={() => verify(nullifier, credentialId)}
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

      {success && (
        <div className="animate-reveal p-6 text-center sm:p-8" role="status" aria-live="polite">
          <OnChainSeal state="verified" size="md" className="mx-auto justify-center" />
          <p className="mt-4 font-headline text-lg font-semibold tracking-tight text-fg-default">
            Verification successful
          </p>
          <p className="mt-1 text-sm text-fg-subtle">
            This income credential is genuine. It was recorded on the Stellar network.
          </p>

          {hasRange && (
            <div className="mt-6 flex justify-center">
              <SealedChip
                range={{ minCents: Number(record?.range_min), maxCents: Number(record?.range_max) }}
                size="md"
              />
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Claim icon={<Award size={12} />}>Employer-attested</Claim>
            <Claim icon={<UserCheck size={12} />}>Recipient-bound</Claim>
            <Claim icon={<Fingerprint size={12} />}>Amount-private</Claim>
          </div>

          {record ? (
            <dl className="mt-6 grid gap-3 border-t border-border pt-5 text-left sm:grid-cols-3">
              <FieldBox label="Issuer" value={truncate(record.employer_ax ?? '')} />
              <FieldBox label="Recipient reference" value={truncate(record.worker_id ?? '')} />
              <FieldBox
                label="Ledger ref"
                value={record.verified_at_ledger != null ? String(record.verified_at_ledger) : '—'}
                accent
              />
            </dl>
          ) : (
            <p className="mt-6 border-t border-border pt-5 text-xs text-fg-faint">
              Open the full shared link to also see the proven range and the attesting employer.
            </p>
          )}
        </div>
      )}

      {result && !success && (
        <div className="p-6 text-sm text-fg-subtle sm:p-8">
          No income credential found for that reference. Check the code, or ask the issuer for a
          fresh link.
        </div>
      )}

      <p className="flex items-start gap-2 border-t border-border bg-surface-2 px-6 py-4 text-xs text-fg-faint sm:px-8">
        <Fingerprint size={13} className="mt-0.5 shrink-0" /> The exact monthly amounts stay private.
        Only the agreed range and the employer that attested it are shown.{' '}
        <span className="inline-flex">
          <InfoHint>
            The credential is checked on-chain: it confirms the income falls within the range without
            revealing any single payment.
          </InfoHint>
        </span>
      </p>
    </Card>
  );
}

function Claim({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="overline inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-3 px-3 py-1 text-fg-subtle">
      {icon}
      {children}
    </span>
  );
}

function FieldBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="overline">{label}</p>
      <p className={`hash mt-1.5 truncate font-medium ${accent ? 'text-brand-text' : 'text-fg-default'}`}>
        {value}
      </p>
    </div>
  );
}
