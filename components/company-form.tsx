'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface CompanyDefaults {
  name?: string;
  cnpj?: string;
  treasury_address?: string;
}

export function CompanyForm({
  defaults,
  submitLabel,
  redirectTo,
}: {
  defaults?: CompanyDefaults;
  submitLabel: string;
  redirectTo?: string;
}) {
  const [name, setName] = useState(defaults?.name ?? '');
  const [cnpj, setCnpj] = useState(defaults?.cnpj ?? '');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (name.trim().length < 2) {
      toast.error('Company name is required');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, cnpj }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.join(', ') || data.error || 'failed');
      toast.success('Company saved');
      if (redirectTo) window.location.href = redirectTo;
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Company name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Ltda" />
      </div>
      <div>
        <Label htmlFor="cnpj">CNPJ (tax id)</Label>
        <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
      </div>
      <Button className="w-full" disabled={busy} onClick={save}>
        {busy ? 'Saving…' : submitLabel}
      </Button>
    </div>
  );
}
