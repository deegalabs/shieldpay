'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ContractorDefaults {
  name?: string;
  cpf?: string;
  stellar_address?: string;
  minUsdc?: number;
  maxUsdc?: number;
}

export function ContractorForm({
  contractorId,
  defaults,
  submitLabel,
  redirectTo = '/contractors',
}: {
  contractorId?: string;
  defaults?: ContractorDefaults;
  submitLabel: string;
  redirectTo?: string;
}) {
  const [f, setF] = useState({
    name: defaults?.name ?? '',
    cpf: defaults?.cpf ?? '',
    stellar_address: defaults?.stellar_address ?? '',
    min: defaults?.minUsdc != null ? String(defaults.minUsdc) : '',
    max: defaults?.maxUsdc != null ? String(defaults.maxUsdc) : '',
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function save() {
    const minUsdc = Number(f.min);
    const maxUsdc = Number(f.max);
    if (f.name.trim().length < 2 || !f.stellar_address.startsWith('G')) {
      return toast.error('Name and a valid Stellar address (G…) are required');
    }
    if (!(maxUsdc > 0) || minUsdc < 0 || minUsdc > maxUsdc) return toast.error('Enter a valid range');

    setBusy(true);
    try {
      const res = await fetch(
        contractorId ? `/api/contractors/${contractorId}` : '/api/contractors',
        {
          method: contractorId ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: f.name,
            cpf: f.cpf || undefined,
            stellar_address: f.stellar_address,
            minUsdc,
            maxUsdc,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.join(', ') || data.error || 'failed');
      toast.success(contractorId ? 'Contractor updated' : 'Contractor added');
      window.location.href = redirectTo;
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={f.name} onChange={set('name')} placeholder="João Silva" />
      </div>
      <div>
        <Label htmlFor="addr">Stellar address</Label>
        <Input id="addr" className="font-mono text-sm" value={f.stellar_address} onChange={set('stellar_address')} placeholder="G…" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min">Min (USDC/mo)</Label>
          <Input id="min" inputMode="decimal" value={f.min} onChange={set('min')} placeholder="450" />
        </div>
        <div>
          <Label htmlFor="max">Max (USDC/mo)</Label>
          <Input id="max" inputMode="decimal" value={f.max} onChange={set('max')} placeholder="550" />
        </div>
      </div>
      <Button className="w-full" disabled={busy} onClick={save}>
        {busy ? 'Saving…' : submitLabel}
      </Button>
    </div>
  );
}
