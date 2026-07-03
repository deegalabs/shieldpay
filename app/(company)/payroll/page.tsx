'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { Plus, Trash2, Lock, ArrowRight, ArrowLeft, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { PayrollStepper, type PayrollPhase } from '@/components/ui/payroll-stepper';
import { usdRange, formatUsdc } from '@/lib/utils';
import { nonCustodialAvailable, runPayrollNonCustodial } from '@/lib/payments/client-run';

const OVERLINE = 'overline';

// Map the run's onProgress strings (see lib/payments/client-run.ts) onto the
// stepper's four discrete phases. "Preparing your wallet" opens the run, so a
// null/unknown message rests on the first stage.
function phaseFromProgress(msg: string | null): PayrollPhase {
  if (msg?.startsWith('Proving')) return 'proving';
  if (msg?.startsWith('Verifying')) return 'verifying';
  if (msg?.startsWith('Recording')) return 'settled';
  return 'sending';
}

// Editorial helpers for the Contributor Ledger rows: avatar initials and a
// short, mono wallet handle (Stellar addresses start with G and are long).
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
function shortAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 5)}…${addr.slice(-4)}` : addr;
}

interface Contractor {
  id: string;
  name: string;
  stellar_address: string;
  range_min: number;
  range_max: number;
  anchored: boolean;
}
interface Line {
  contractorId: string;
  amount: string;
}

// A validated line ready for review and for the run. Cents are carried alongside
// the USDC figures so the masked-amount chips can render the range directly.
interface ReviewLine {
  contractorId: string;
  workerName: string;
  workerAddress: string;
  minCents: number;
  maxCents: number;
  minUsdc: number;
  maxUsdc: number;
  amountUsdc: number;
  amountCents: number;
}

export default function PayrollPage() {
  const { user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [reference, setReference] = useState('JUN2026');
  const [lines, setLines] = useState<Line[]>([{ contractorId: '', amount: '' }]);
  // 'enter' builds the run; 'review' restates it and gates the irreversible pay.
  const [step, setStep] = useState<'enter' | 'review'>('enter');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The company's own Stellar wallet (non-custodial signer). When present and the
  // public contract id is configured, the company signs its own on-chain calls.
  const wallet = (user?.linkedAccounts ?? []).find(
    (a: any) => a?.type === 'wallet' && a?.chainType === 'stellar' && a?.address,
  ) as any;
  const walletAddr: string | undefined = wallet?.address;

  useEffect(() => {
    fetch('/api/contractors')
      .then((r) => (r.ok ? r.json() : { contractors: [] }))
      .then((d) => setContractors((d.contractors ?? []).filter((c: Contractor) => c.stellar_address)))
      .catch(() => setContractors([]));
  }, []);

  const byId = (id: string) => contractors.find((c) => c.id === id);

  // Only lines with a chosen contributor and an amount become review lines.
  function buildReviewLines(): ReviewLine[] {
    return lines
      .map((l) => {
        const c = byId(l.contractorId);
        if (!c) return null;
        const amountUsdc = Number(l.amount);
        return {
          contractorId: c.id,
          workerName: c.name,
          workerAddress: c.stellar_address,
          minCents: c.range_min,
          maxCents: c.range_max,
          minUsdc: c.range_min / 100,
          maxUsdc: c.range_max / 100,
          amountUsdc,
          amountCents: Math.round(amountUsdc * 100),
        } as ReviewLine;
      })
      .filter(Boolean) as ReviewLine[];
  }

  // The same checks the run applies, surfaced up front so the review step only
  // ever restates a run that is ready to settle.
  function firstReviewError(built: ReviewLine[]): string | null {
    if (built.length === 0) return 'Add at least one contributor with an amount.';
    for (const l of lines) {
      const c = byId(l.contractorId);
      if (c && !c.anchored) {
        return `${c.name}: identity not anchored yet. They must finish accepting the invite before they can be paid.`;
      }
    }
    for (const b of built) {
      if (!(b.amountUsdc > 0) || b.amountUsdc < b.minUsdc || b.amountUsdc > b.maxUsdc) {
        return `${b.workerName}: amount must be within $${b.minUsdc}-$${b.maxUsdc}.`;
      }
    }
    return null;
  }

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  // Gate: validate the builder, then move to the review summary. Money only
  // moves from the review step, never straight from the form.
  function goToReview() {
    const err = firstReviewError(buildReviewLines());
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep('review');
  }

  async function run() {
    const built = lines
      .map((l) => {
        const c = byId(l.contractorId);
        if (!c) return null;
        const amount = Number(l.amount);
        return {
          workerName: c.name,
          workerAddress: c.stellar_address,
          minUsdc: c.range_min / 100,
          maxUsdc: c.range_max / 100,
          amountUsdc: amount,
        };
      })
      .filter(Boolean) as any[];

    if (built.length === 0) return setError('Add at least one contributor with an amount.');
    for (const l of lines) {
      const c = byId(l.contractorId);
      if (c && !c.anchored) {
        return setError(`${c.name}: identity not anchored yet. They must finish accepting the invite before they can be paid.`);
      }
    }
    for (const b of built) {
      if (!(b.amountUsdc > 0) || b.amountUsdc < b.minUsdc || b.amountUsdc > b.maxUsdc) {
        return setError(`${b.workerName}: amount must be within $${b.minUsdc}-$${b.maxUsdc}.`);
      }
    }

    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      // Non-custodial path: the company signs its own on-chain calls with its
      // wallet, the server never holds a company key. Falls back to the custodial
      // endpoint when no wallet is linked or the public contract id is unset.
      if (nonCustodialAvailable() && walletAddr) {
        const { runId } = await runPayrollNonCustodial({
          walletAddress: walletAddr,
          signRawHash,
          reference,
          lines: built.map((b) => ({
            workerName: b.workerName,
            workerAddress: b.workerAddress,
            amountUsdc: b.amountUsdc,
            minUsdc: b.minUsdc,
            maxUsdc: b.maxUsdc,
          })),
          onProgress: setProgress,
        });
        window.location.href = `/payroll/${runId}`;
        return;
      }

      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference, lines: built }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      window.location.href = `/payroll/${data.runId}`;
    } catch (e) {
      // Keep the real cause for debugging, never raw in the UI. The person reads a
      // calm, blame-free line: the money did not move, so nothing is at risk.
      console.error('Payroll run failed', e);
      setError('The payment did not go through. Nothing was sent. You can try again in a moment.');
      setBusy(false);
      setProgress(null);
    }
  }

  const reviewLines = buildReviewLines();
  const reviewTotal = reviewLines.reduce((s, l) => s + l.amountUsdc, 0);
  const formTotal = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  const privacyNote =
    nonCustodialAvailable() && walletAddr
      ? 'You sign each payment with your own wallet. Each amount stays private on-chain.'
      : 'Each individual amount is kept private on-chain. This may take a few seconds per contributor.';

  const errorPanel = error && (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden />
      <p className="text-sm text-fg-strong">{error}</p>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 md:gap-14">
      {/* Editorial header: overline + the run reference as the lead figure. */}
      <header className="flex flex-col items-center gap-2 text-center">
        <span className={`${OVERLINE} tracking-[0.2em]`}>Run Payroll</span>
        <h1 className="relative inline-block font-headline text-4xl font-bold tracking-tight text-fg-default md:text-5xl">
          {reference || '—'}
          <span
            aria-hidden
            className="absolute -right-4 top-2 size-2 rounded-full bg-brand shadow-[0_0_12px_rgba(99,102,241,0.8)]"
          />
        </h1>
        <p className="mt-1 max-w-md text-sm text-fg-subtle">
          {step === 'review'
            ? 'Confidential distribution sequence ready. Each amount stays cryptographically masked.'
            : 'Build the run. Each amount stays private on-chain; only the range is public and the total is yours to prove.'}
        </p>
      </header>

      {contractors.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-medium text-fg-strong">No active contributors yet</p>
          <p className="mt-1 text-sm text-fg-subtle">
            Invite contributors and have them accept before running payroll.
          </p>
          <Button asChild className="mt-4">
            <a href="/contractors/new">Invite contributor</a>
          </Button>
        </Card>
      ) : step === 'enter' ? (
        <div className="flex flex-col gap-6">
          <Card className="space-y-6 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="ref">Reference (e.g. month)</Label>
              <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>

            <div className="space-y-3">
              <p className={OVERLINE}>Payment lines</p>
              {lines.map((l, i) => {
                const c = byId(l.contractorId);
                return (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor={`c${i}`}>Contributor</Label>
                      <select
                        id={`c${i}`}
                        className="input"
                        value={l.contractorId}
                        onChange={(e) => setLine(i, { contractorId: e.target.value })}
                      >
                        <option value="">Choose…</option>
                        {contractors.map((ct) => (
                          <option key={ct.id} value={ct.id} disabled={!ct.anchored}>
                            {ct.name} ({usdRange(ct.range_min, ct.range_max)})
                            {ct.anchored ? ' ✓' : ' (pending anchor)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28 space-y-1.5">
                      <Label htmlFor={`a${i}`}>Amount</Label>
                      <Input
                        id={`a${i}`}
                        inputMode="decimal"
                        value={l.amount}
                        onChange={(e) => setLine(i, { amount: e.target.value })}
                        placeholder={c ? usdRange(c.range_min, c.range_max) : 'USDC'}
                      />
                    </div>
                    {lines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove contributor"
                        onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLines((ls) => [...ls, { contractorId: '', amount: '' }])}
              >
                <Plus size={14} /> Add contributor
              </Button>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className={OVERLINE}>Run total (visible to you)</span>
              <span className="mono text-lg font-semibold text-fg-default tabular-nums">
                {formatUsdc(formTotal)} USDC
              </span>
            </div>

            <Button className="w-full" size="lg" onClick={goToReview}>
              Review payroll <ArrowRight size={16} />
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
              <Lock size={12} /> {privacyNote}
            </p>
          </Card>

          {errorPanel}
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {/* Sequence Status: the stepper is the hero of the run flow. */}
          <section className="relative overflow-hidden rounded-2xl border border-border bg-surface-2/40 p-6 backdrop-blur-sm md:p-8">
            {/* Decorative corner highlights (light, never paint). */}
            <div
              aria-hidden
              className="absolute left-0 top-0 h-px w-16 bg-gradient-to-r from-brand/50 to-transparent"
            />
            <div
              aria-hidden
              className="absolute left-0 top-0 h-16 w-px bg-gradient-to-b from-brand/50 to-transparent"
            />
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-headline text-lg font-medium text-fg-strong">Sequence Status</h2>
              <div className="mono flex items-center gap-2 text-sm text-brand-text">
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full bg-brand ${busy ? 'animate-pulse' : ''}`}
                />
                {busy ? 'PROVING' : `${reviewLines.length} QUEUED`}
              </div>
            </div>
            <PayrollStepper phase={busy ? phaseFromProgress(progress) : 'sending'} />
          </section>

          {/* Contributor Ledger: name + short wallet, sealed range, seal + HIDDEN. */}
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between px-1">
              <h3 className={OVERLINE}>Contributor Ledger</h3>
              <span className="mono rounded border border-border px-2 py-1 text-xs text-fg-subtle">
                USDC NETWORK
              </span>
            </div>
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-2/20">
              {reviewLines.map((l, i) => (
                <div
                  key={l.contractorId}
                  className="group flex flex-col gap-3 p-4 transition-colors hover:bg-surface-3/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Index + recipient identity. */}
                  <div className="flex items-center gap-3 sm:w-[42%]">
                    <span className="mono hidden w-6 shrink-0 text-xs text-fg-faint sm:block">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface-3 font-headline text-sm text-fg-subtle">
                      {initials(l.workerName)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-fg-strong">{l.workerName}</div>
                      <div className="mono mt-0.5 truncate text-xs text-fg-faint">
                        {shortAddr(l.workerAddress)}
                      </div>
                    </div>
                  </div>
                  {/* Sealed agreed range. */}
                  <div className="flex sm:w-[32%] sm:justify-center">
                    <SealedChip range={{ minCents: l.minCents, maxCents: l.maxCents }} size="md" />
                  </div>
                  {/* On-chain status + the amount, sealed as literal HIDDEN. */}
                  <div className="flex items-center justify-between gap-3 sm:w-[26%] sm:justify-end">
                    {busy ? (
                      <OnChainSeal state="computing" />
                    ) : (
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-full border border-verified/30 bg-verified/15 text-verified-text shadow-[0_0_16px_-6px_rgba(16,185,129,0.5)]"
                        title="Within agreed range"
                        aria-label="Within agreed range"
                      >
                        <ShieldCheck size={14} strokeWidth={2.25} aria-hidden />
                      </span>
                    )}
                    <span className="mono text-sm text-fg-default">HIDDEN</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Aggregate total + the confirm gate. Money moves only from here. */}
          <section className="flex flex-col items-center gap-8 border-t border-border pt-12">
            <div className="relative flex flex-col items-center gap-2 text-center">
              <div
                aria-hidden
                className="absolute left-1/2 top-6 -z-10 h-24 w-72 -translate-x-1/2 rounded-full bg-brand/10 blur-[60px]"
              />
              <span className={OVERLINE}>Aggregate Total Run</span>
              <div className="mono text-4xl font-light tracking-tight text-fg-default tabular-nums md:text-5xl">
                {formatUsdc(reviewTotal)} <span className="ml-2 text-2xl text-fg-subtle">USDC</span>
              </div>
              <p className="mono text-xs text-fg-subtle">
                {reviewLines.length} {reviewLines.length === 1 ? 'PAYMENT' : 'PAYMENTS'} · {reference}
              </p>
            </div>

            <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                className="w-full font-label uppercase tracking-wider sm:w-auto"
                onClick={() => setStep('enter')}
                disabled={busy}
              >
                <ArrowLeft size={16} /> Edit Run
              </Button>
              <Button
                size="lg"
                className="w-full font-label uppercase tracking-wider shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] sm:w-auto"
                onClick={run}
                disabled={busy}
              >
                <Lock size={16} /> {busy ? 'Signing…' : 'Confirm & Sign'}
              </Button>
            </div>

            <p className="flex items-center gap-2 text-xs text-fg-subtle">
              <Info size={14} aria-hidden /> Signing initiates the on-chain proofs for every payment.
            </p>
          </section>

          {errorPanel}
        </div>
      )}
    </div>
  );
}
