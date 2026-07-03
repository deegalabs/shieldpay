'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { Plus, Trash2, Lock, ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, type Column } from '@/components/ui/data-table';
import { MaskedAmount } from '@/components/ui/masked-amount';
import { PayrollStepper, type PayrollPhase } from '@/components/ui/payroll-stepper';
import { usdRange, formatUsdc } from '@/lib/utils';
import { nonCustodialAvailable, runPayrollNonCustodial } from '@/lib/payments/client-run';

const OVERLINE = 'text-xs font-[550] uppercase tracking-[0.06em] text-fg-subtle';

// Map the run's onProgress strings (see lib/payments/client-run.ts) onto the
// stepper's four discrete phases. "Preparing your wallet" opens the run, so a
// null/unknown message rests on the first stage.
function phaseFromProgress(msg: string | null): PayrollPhase {
  if (msg?.startsWith('Proving')) return 'proving';
  if (msg?.startsWith('Verifying')) return 'verifying';
  if (msg?.startsWith('Recording')) return 'settled';
  return 'sending';
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

  const reviewColumns: Array<Column<ReviewLine>> = [
    {
      header: 'Contributor',
      cell: (l) => <span className="font-medium text-fg-strong">{l.workerName}</span>,
    },
    {
      header: 'Agreed range',
      cell: (l) => <MaskedAmount state="masked" range={{ minCents: l.minCents, maxCents: l.maxCents }} />,
    },
    {
      header: 'Amount to pay',
      align: 'money',
      cell: (l) => (
        <MaskedAmount
          state="disclosed"
          range={{ minCents: l.minCents, maxCents: l.maxCents }}
          amountCents={l.amountCents}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg-default">Run payroll</h1>
        <p className="mt-1.5 text-sm text-fg-subtle">
          Pay your team in one run. Each amount stays private on-chain; only the range is public and
          the total is yours to prove.
        </p>
      </div>

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
        <>
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
              <span className="text-sm text-fg-subtle">Run total (visible to you)</span>
              <span className="figure text-lg font-semibold text-fg-default">{formatUsdc(formTotal)} USDC</span>
            </div>

            <Button className="w-full" size="lg" onClick={goToReview}>
              Review payroll <ArrowRight size={16} />
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
              <Lock size={12} />{' '}
              {nonCustodialAvailable() && walletAddr
                ? 'You sign each payment with your own wallet. Each amount stays private on-chain.'
                : 'Each individual amount is kept private on-chain. This may take a few seconds per contributor.'}
            </p>
          </Card>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden />
              <p className="text-sm text-fg-strong">{error}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="space-y-6 p-6">
            <div className="space-y-1">
              <p className={OVERLINE}>Review and confirm</p>
              <p className="text-sm text-fg-subtle">
                Confirm the run before any money moves. This settles on-chain and cannot be undone.
              </p>
            </div>

            <div className="flex items-end justify-between border-b border-border pb-5">
              <div>
                <p className={OVERLINE}>Run total</p>
                <p className="figure-hero mt-1 text-3xl font-semibold">{formatUsdc(reviewTotal)} USDC</p>
              </div>
              <p className="figure text-sm text-fg-subtle">
                {reviewLines.length} {reviewLines.length === 1 ? 'payment' : 'payments'} · {reference}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <DataTable
                columns={reviewColumns}
                rows={reviewLines}
                rowKey={(l) => l.contractorId}
                caption="Payments in this run, with each agreed range and the amount to pay."
              />
            </div>

            {busy ? (
              <div className="rounded-lg border border-border bg-surface-2/50 px-4 py-5">
                <PayrollStepper
                  phase={phaseFromProgress(progress)}
                  counter={`${reviewLines.length} ${reviewLines.length === 1 ? 'payment' : 'payments'}`}
                />
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="ghost" size="lg" onClick={() => setStep('enter')} disabled={busy}>
                  <ArrowLeft size={16} /> Edit
                </Button>
                <Button variant="success" size="lg" className="flex-1" onClick={run} disabled={busy}>
                  <ShieldCheck size={16} /> Confirm and pay {formatUsdc(reviewTotal)} USDC
                </Button>
              </div>
            )}

            <p className="flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
              <Lock size={12} />{' '}
              {nonCustodialAvailable() && walletAddr
                ? 'You sign each payment with your own wallet. Each amount stays private on-chain.'
                : 'Each individual amount is kept private on-chain. This may take a few seconds per contributor.'}
            </p>
          </Card>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden />
              <p className="text-sm text-fg-strong">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
