'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface CompanyDefaults {
  name?: string;
  type?: string;
  cnpj?: string;
  treasury_address?: string;
  responsible_name?: string;
  responsible_email?: string;
  auditor_contact?: string;
  require_invoice?: boolean;
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
  const [f, setF] = useState({
    name: defaults?.name ?? '',
    type: defaults?.type ?? 'company',
    cnpj: defaults?.cnpj ?? '',
    treasury_address: defaults?.treasury_address ?? '',
    responsible_name: defaults?.responsible_name ?? '',
    responsible_email: defaults?.responsible_email ?? '',
    auditor_contact: defaults?.auditor_contact ?? '',
    require_invoice: defaults?.require_invoice ?? false,
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function save() {
    if (f.name.trim().length < 2) {
      toast.error('Organization name is required');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.join(', ') || data.error || 'failed');
      toast.success('Organization saved');
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
        <Label htmlFor="name">Organization name</Label>
        <Input id="name" value={f.name} onChange={set('name')} placeholder="Acme DAO" />
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          className="input"
          value={f.type}
          onChange={(e) => setF({ ...f, type: e.target.value })}
        >
          <option value="company">Web3 company</option>
          <option value="dao">DAO</option>
          <option value="treasury">Treasury</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cnpj">Legal id (optional)</Label>
          <Input id="cnpj" value={f.cnpj} onChange={set('cnpj')} placeholder="CNPJ / EIN…" />
        </div>
        <div>
          <Label htmlFor="treasury">Treasury wallet (optional)</Label>
          <Input id="treasury" className="font-mono text-xs" value={f.treasury_address} onChange={set('treasury_address')} placeholder="G…" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rname">Responsible (name)</Label>
          <Input id="rname" value={f.responsible_name} onChange={set('responsible_name')} placeholder="Jane Doe" />
        </div>
        <div>
          <Label htmlFor="remail">Responsible (email)</Label>
          <Input id="remail" type="email" value={f.responsible_email} onChange={set('responsible_email')} placeholder="ops@acme.xyz" />
        </div>
      </div>

      <div>
        <Label htmlFor="auditor">Auditor / viewing-key holder (optional)</Label>
        <Input id="auditor" type="email" value={f.auditor_contact} onChange={set('auditor_contact')} placeholder="treasury@acme.xyz" />
        <p className="mt-1 text-xs text-muted">Who may reveal exact amounts later (selective disclosure).</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[hsl(var(--brand))]"
          checked={f.require_invoice}
          onChange={(e) => setF({ ...f, require_invoice: e.target.checked })}
        />
        Require an invoice (NF) on each payment
      </label>

      <Button className="w-full" disabled={busy} onClick={save}>
        {busy ? 'Saving…' : submitLabel}
      </Button>
    </div>
  );
}
