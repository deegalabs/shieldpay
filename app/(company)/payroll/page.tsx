'use client';

import { useEffect, useState } from 'react';
import { Send, Plus, Trash2, Loader2, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usdRange, formatUsdc } from '@/lib/utils';

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

export default function PayrollPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [reference, setReference] = useState('JUN2026');
  const [lines, setLines] = useState<Line[]>([{ contractorId: '', amount: '' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/contractors')
      .then((r) => (r.ok ? r.json() : { contractors: [] }))
      .then((d) => setContractors((d.contractors ?? []).filter((c: Contractor) => c.stellar_address)))
      .catch(() => setContractors([]));
  }, []);

  const byId = (id: string) => contractors.find((c) => c.id === id);
  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
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

    if (built.length === 0) return setError('Add at least one collaborator with an amount.');
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
    try {
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference, lines: built }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      window.location.href = `/payroll/${data.runId}`;
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Run payroll</h1>
        <p className="mt-1 text-sm text-muted">
          Pay your team in one run. Each amount stays private on-chain; only the range is public and
          the total is yours to prove.
        </p>
      </div>

      {contractors.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-medium">No active collaborators yet</p>
          <p className="mt-1 text-sm text-muted">Invite collaborators and have them accept before running payroll.</p>
          <Button asChild className="mt-4">
            <a href="/contractors/new">Invite collaborator</a>
          </Button>
        </Card>
      ) : (
        <>
          <Card className="space-y-4 p-6">
            <div>
              <Label htmlFor="ref">Reference (e.g. month)</Label>
              <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>

            <div className="space-y-3">
              {lines.map((l, i) => {
                const c = byId(l.contractorId);
                return (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`c${i}`}>Collaborator</Label>
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
                            {ct.anchored ? ' ✓' : ' — pending anchor'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
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
                        onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                );
              })}
              <Button variant="ghost" size="sm" onClick={() => setLines((ls) => [...ls, { contractorId: '', amount: '' }])}>
                <Plus size={14} /> Add collaborator
              </Button>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
              <span className="text-muted">Run total (visible to you)</span>
              <span className="text-lg font-bold">{formatUsdc(total)} USDC</span>
            </div>

            <Button className="w-full" size="lg" onClick={run} disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {busy ? 'Proving & recording on-chain…' : 'Run payroll & prove'}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <Lock size={12} /> Each individual amount is hidden on-chain (commitment). This may take
              a few seconds per collaborator.
            </p>
          </Card>

          {error && (
            <Card className="border-danger/40 p-4">
              <p className="text-sm text-danger">{error}</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
