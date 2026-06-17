'use client';

import { useEffect, useState } from 'react';
import { Send, ShieldCheck, ArrowUpRight, Check, Loader2, Lock } from 'lucide-react';
import { DEMO_WORKER } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface PayrollForm {
  workerName: string;
  workerAddress: string;
  amountUsdc: number;
  minUsdc: number;
  maxUsdc: number;
  reference: string;
}

interface Contractor {
  id: string;
  name: string;
  stellar_address: string;
  range_min: number;
  range_max: number;
  anchored: boolean;
}

interface PayrollResult {
  ok: boolean;
  workerName: string;
  reference: string;
  range: { min: number; max: number };
  proofId: string;
  onChain: { txHash: string; explorerUrl: string; verified: boolean };
}

const STAGES = [
  'Committing to the amount',
  'Generating the zero-knowledge proof',
  'Verifying the proof on-chain',
  'Recording the result',
];

export default function PayrollPage() {
  const [form, setForm] = useState<PayrollForm>({
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
  const [contractors, setContractors] = useState<Contractor[]>([]);

  useEffect(() => {
    fetch('/api/contractors')
      .then((r) => (r.ok ? r.json() : { contractors: [] }))
      // Only active collaborators (with a wallet) can be paid.
      .then((d) => setContractors((d.contractors ?? []).filter((c: Contractor) => c.stellar_address)))
      .catch(() => setContractors([]));
  }, []);

  function selectContractor(id: string) {
    const c = contractors.find((x) => x.id === id);
    if (!c) return;
    setForm((f) => ({
      ...f,
      workerName: c.name,
      workerAddress: c.stellar_address,
      minUsdc: c.range_min / 100,
      maxUsdc: c.range_max / 100,
      amountUsdc: Math.round((c.range_min + c.range_max) / 2 / 100),
    }));
  }

  const running = stage >= 0 && !result && !error;
  const set = (k: keyof PayrollForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });

  async function run() {
    setResult(null);
    setError(null);
    setStage(0);
    const timers = [700, 1600, 2800].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pay &amp; Prove</h1>
        <p className="mt-1 text-sm text-muted">
          Pay a contractor within their agreed range and generate a mathematical, on-chain proof —
          without revealing the exact amount.
        </p>
      </div>

      <Card className="space-y-4 p-6">
        {contractors.length > 0 && (
          <div>
            <Label htmlFor="pick">Select a contractor</Label>
            <select
              id="pick"
              className="input"
              defaultValue=""
              onChange={(e) => selectContractor(e.target.value)}
            >
              <option value="" disabled>
                Choose from your contractors…
              </option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — ${c.range_min / 100}–${c.range_max / 100} USDC{c.anchored ? ' ✓' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="name">Contractor</Label>
          <Input id="name" value={form.workerName} onChange={set('workerName')} />
        </div>
        <div>
          <Label htmlFor="addr">Stellar address</Label>
          <Input id="addr" className="font-mono text-xs" value={form.workerAddress} onChange={set('workerAddress')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="amt">Amount (USDC)</Label>
            <Input id="amt" type="number" value={form.amountUsdc} onChange={set('amountUsdc')} />
          </div>
          <div>
            <Label htmlFor="min">Min</Label>
            <Input id="min" type="number" value={form.minUsdc} onChange={set('minUsdc')} />
          </div>
          <div>
            <Label htmlFor="max">Max</Label>
            <Input id="max" type="number" value={form.maxUsdc} onChange={set('maxUsdc')} />
          </div>
        </div>
        <div>
          <Label htmlFor="ref">Reference</Label>
          <Input id="ref" value={form.reference} onChange={set('reference')} />
        </div>

        <Button className="w-full" size="lg" onClick={run} disabled={running}>
          {running ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {running ? 'Processing…' : 'Pay & Prove'}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <Lock size={12} /> The exact amount never leaves the server — only the range is public.
        </p>
      </Card>

      {stage >= 0 && !result && !error && (
        <Card className="space-y-3 p-6">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-3 text-sm">
              <span
                className={
                  'grid h-6 w-6 place-items-center rounded-full ' +
                  (i < stage
                    ? 'bg-primary/15 text-primary'
                    : i === stage
                      ? 'bg-brand/15 text-brand'
                      : 'bg-surface-2 text-muted')
                }
              >
                {i < stage ? <Check size={13} /> : i === stage ? <Loader2 size={13} className="animate-spin" /> : i + 1}
              </span>
              <span className={i <= stage ? 'text-foreground' : 'text-muted'}>{s}</span>
            </div>
          ))}
        </Card>
      )}

      {error && (
        <Card className="border-danger/40 p-6">
          <p className="font-medium text-danger">Could not complete</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </Card>
      )}

      {result && (
        <Card className="space-y-3 p-6">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Payment proven</p>
            <Badge variant="success">
              <ShieldCheck size={12} /> Verified on-chain
            </Badge>
          </div>
          <Row label="Contractor" value={result.workerName} />
          <Row label="Reference" value={result.reference} />
          <Row label="Proven range" value={`$${result.range.min} – $${result.range.max} USDC`} />
          <Row label="On-chain proof id" value={`#${result.proofId}`} />
          <p className="pt-1 text-sm text-muted">
            The Stellar network mathematically verified the amount is within the agreed range. The
            exact figure stays private.
          </p>
          <Button asChild variant="ghost" className="w-full">
            <a href={result.onChain.explorerUrl} target="_blank" rel="noreferrer">
              View proof on Stellar Explorer <ArrowUpRight size={14} />
            </a>
          </Button>
        </Card>
      )}
    </div>
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
