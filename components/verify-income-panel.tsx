'use client';

import * as React from 'react';
import {
  Search,
  KeyRound,
  Fingerprint,
  UserCheck,
  Award,
  CalendarDays,
  ChevronDown,
  Copy,
  ShieldCheck,
  Share2,
  Check,
} from 'lucide-react';
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
  const [copied, setCopied] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);

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

  // Share the same public credential link the auto-verify effect reads back
  // (/verify-income?n=<nullifier>&id=<id>). This is a UI convenience only; it
  // does not touch the verification logic or any API call.
  const onShare = React.useCallback(async () => {
    const params = new URLSearchParams();
    const n = nullifier.trim().toLowerCase();
    if (n) params.set('n', n);
    if (credentialId) params.set('id', credentialId);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'ShieldPay income proof', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // The user dismissed the share sheet, or clipboard was blocked. Nothing to do.
    }
  }, [nullifier, credentialId]);

  // Copy the credential reference (the proof id shown on the result card) to the
  // clipboard. Display convenience only; it does not touch verification or any API.
  const onCopyProof = React.useCallback(async () => {
    const value = nullifier.trim().toLowerCase();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Clipboard was blocked. Nothing to do.
    }
  }, [nullifier]);

  const record = result?.record ?? null;
  const success = result?.presented === true;
  const hasRange = record?.range_min != null && record?.range_max != null;

  return (
    <Card className="overflow-hidden p-0 shadow-edge">
      {/* Desktop / tablet layout (md and up). Logic untouched. */}
      <div className="hidden md:block">
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
      </div>

      {/* Mobile layout (below md). Same state, same handler, same result object. */}
      <div className="md:hidden">
        <div className="border-b border-border bg-surface-2 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0 text-brand-text" aria-hidden />
            <p className="overline text-brand-text">Proof of income</p>
          </div>
          <h3 className="mt-2 font-headline text-xl font-semibold tracking-tight text-fg-default">
            Verify Income
          </h3>
          <p className="mt-2 text-sm text-fg-subtle">
            Generate a zero-knowledge proof of your income to share securely without revealing exact
            figures.
          </p>

          <label htmlFor="credential-ref-mobile" className="overline mt-5 block">
            Employer credential key
          </label>
          <div className="relative mt-2">
            <KeyRound
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint"
              aria-hidden
            />
            <Input
              id="credential-ref-mobile"
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

          {/* Only one verification type exists today (salary range attestation), so
              this reads as a settled, disabled select rather than a live control. */}
          <span className="overline mt-4 block">Verification type</span>
          <div className="relative mt-2" aria-disabled>
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint"
              aria-hidden
            />
            <div className="flex h-12 items-center rounded-lg border border-border bg-surface pl-11 pr-10 text-sm text-fg-default">
              Annual Salary Range
            </div>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-faint"
              aria-hidden
            />
          </div>

          <Button
            onClick={() => verify(nullifier, credentialId)}
            disabled={loading}
            variant="primary"
            className="mt-4 h-12 w-full"
          >
            <Search size={16} /> {loading ? 'Checking…' : 'Verify on-chain'}
          </Button>

          {loading && (
            <div className="mt-3 flex flex-col gap-2" role="status" aria-live="polite">
              <span className="text-xs font-medium text-brand-text">Verifying Credential…</span>
              <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-danger-text" role="alert">
              {error}
            </p>
          )}
        </div>

        {success && (
          <div className="animate-reveal p-5" role="status" aria-live="polite">
            <div className="rounded-xl border border-verified/30 bg-surface p-4 top-edge">
              <div className="flex items-center gap-3">
                <OnChainSeal state="verified" size="md" />
                <div>
                  <p className="text-sm font-medium text-fg-default">Proof Generated</p>
                  <p className="overline text-verified-text">On-chain settled</p>
                </div>
              </div>

              {hasRange && (
                <div className="mt-4 border-t border-border pt-4">
                  <span className="overline block">Verified salary range</span>
                  <div className="mt-2">
                    <SealedChip
                      range={{
                        minCents: Number(record?.range_min),
                        maxCents: Number(record?.range_max),
                      }}
                      size="md"
                      className="self-start"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-border pt-4">
                <span className="overline block">Attestations</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Claim icon={<Award size={12} />}>Employer-attested</Claim>
                  <Claim icon={<UserCheck size={12} />}>Recipient-bound</Claim>
                  <Claim icon={<Fingerprint size={12} />}>Amount-private</Claim>
                </div>
              </div>

              {record ? (
                <dl className="mt-4 grid gap-3 border-t border-border pt-4">
                  <FieldBox label="Issuer" value={truncate(record.employer_ax ?? '')} />
                  <FieldBox
                    label="Recipient reference"
                    value={truncate(record.worker_id ?? '')}
                  />
                  <FieldBox
                    label="Ledger ref"
                    value={
                      record.verified_at_ledger != null
                        ? String(record.verified_at_ledger)
                        : '—'
                    }
                    accent
                  />
                </dl>
              ) : (
                <p className="mt-4 border-t border-border pt-4 text-xs text-fg-faint">
                  Open the full shared link to also see the proven range and the attesting employer.
                </p>
              )}

              {nullifier.trim() && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-3 p-3">
                  <span className="hash truncate text-xs text-fg-subtle">
                    {truncate(nullifier.trim().toLowerCase())}
                  </span>
                  <button
                    type="button"
                    onClick={onCopyProof}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-text transition hover:text-fg-default"
                  >
                    {copiedId ? (
                      <>
                        Copied <Check size={14} />
                      </>
                    ) : (
                      <>
                        Copy <Copy size={14} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <Button onClick={onShare} variant="primary" className="mt-4 h-12 w-full">
              {copied ? (
                <>
                  <Check size={16} /> Link copied
                </>
              ) : (
                <>
                  <Share2 size={16} /> Share Proof
                </>
              )}
            </Button>
            <p className="overline mt-3 text-center text-fg-faint">Secured by ZK-SNARK</p>
          </div>
        )}

        {result && !success && (
          <div className="p-5 text-sm text-fg-subtle">
            No income credential found for that reference. Check the code, or ask the issuer for a
            fresh link.
          </div>
        )}

        <p className="flex items-start gap-2 border-t border-border bg-surface-2 px-5 py-4 text-xs text-fg-faint">
          <Fingerprint size={13} className="mt-0.5 shrink-0" /> The exact monthly amounts stay
          private. Only the agreed range and the employer that attested it are shown.
        </p>
      </div>
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
