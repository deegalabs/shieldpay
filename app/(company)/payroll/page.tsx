'use client';

import { useState } from 'react';
import { DEMO_WORKER } from '@/lib/constants';

interface PayrollResult {
  ok: boolean;
  workerName: string;
  reference: string;
  range: { min: number; max: number };
  proofId: string;
  onChain: { txHash: string; explorerUrl: string; verified: boolean };
  publicSignals: string[];
}

const STAGES = [
  'Committing to the amount…',
  'Generating zero-knowledge proof…',
  'Verifying the proof on-chain…',
  'Recording the result…',
];

export default function PayrollPage() {
  const [form, setForm] = useState({
    workerName: DEMO_WORKER.name,
    workerAddress: DEMO_WORKER.address,
    amountUsdc: 500,
    minUsdc: 450,
    maxUsdc: 550,
    reference: 'MAY2026',
  });
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState<PayrollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const running = stage >= 0 && !result && !error;

  async function run() {
    setResult(null);
    setError(null);
    setStage(0);
    // Advance the visible stages while the request is in flight.
    const timers = [600, 1500, 2600].map((ms, i) =>
      setTimeout(() => setStage(i + 1), ms),
    );
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      timers.forEach(clearTimeout);
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
        setStage(-1);
        return;
      }
      setStage(STAGES.length);
      setResult(data);
    } catch (e) {
      timers.forEach(clearTimeout);
      setError(String(e));
      setStage(-1);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Pay &amp; Prove</h1>
      <p className="mt-2 text-muted">
        Pay a contractor within their agreed range and generate a mathematical,
        on-chain proof of payment — without revealing the exact amount.
      </p>

      <div className="card mt-8 space-y-4">
        <Field label="Contractor">
          <input className="input" value={form.workerName} onChange={set('workerName')} />
        </Field>
        <Field label="Stellar address">
          <input className="input font-mono text-sm" value={form.workerAddress} onChange={set('workerAddress')} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Amount (USDC)">
            <input type="number" className="input" value={form.amountUsdc} onChange={set('amountUsdc')} />
          </Field>
          <Field label="Min (USDC)">
            <input type="number" className="input" value={form.minUsdc} onChange={set('minUsdc')} />
          </Field>
          <Field label="Max (USDC)">
            <input type="number" className="input" value={form.maxUsdc} onChange={set('maxUsdc')} />
          </Field>
        </div>
        <Field label="Reference">
          <input className="input" value={form.reference} onChange={set('reference')} />
        </Field>

        <button className="btn-primary w-full" onClick={run} disabled={running}>
          {running ? 'Processing…' : 'Pay & Prove'}
        </button>
      </div>

      {stage >= 0 && !result && !error && (
        <div className="card mt-6 space-y-2">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-3 text-sm">
              <span className={i < stage ? 'text-primary' : i === stage ? 'text-foreground' : 'text-muted'}>
                {i < stage ? '✓' : i === stage ? '◐' : '○'}
              </span>
              <span className={i <= stage ? 'text-foreground' : 'text-muted'}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="card mt-6 border-danger/40">
          <p className="font-medium text-danger">Could not complete</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </div>
      )}

      {result && (
        <div className="card mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Payment proven ✅</p>
            <span className="badge-verified">Verified on-chain</span>
          </div>
          <Row label="Contractor" value={result.workerName} />
          <Row label="Reference" value={result.reference} />
          <Row label="Proven range" value={`$${result.range.min} – $${result.range.max} USDC`} />
          <Row label="On-chain proof id" value={`#${result.proofId}`} />
          <p className="pt-2 text-sm text-muted">
            The exact amount stays private. The Stellar network mathematically
            verified it falls within the agreed range.
          </p>
          <a className="btn-ghost w-full" href={result.onChain.explorerUrl} target="_blank" rel="noreferrer">
            View proof on Stellar Explorer ↗
          </a>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
