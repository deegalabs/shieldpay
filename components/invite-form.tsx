'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Company-side: invite a collaborator. On success shows the shareable link. */
export function InviteForm() {
  const [f, setF] = useState({ name: '', email: '', role: '', minUsdc: 0, maxUsdc: 0 });
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });

  async function invite() {
    if (f.name.trim().length < 2 || f.maxUsdc <= 0) {
      toast.error('Name and a valid range are required');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/contractors/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.join(', ') || data.error || 'failed');
      setLink(data.url);
      toast.success('Invite created');
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (link) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Invite created. Share this link with the collaborator — they accept, connect a wallet,
          and become active.
        </p>
        <div className="flex items-center gap-2">
          <Input readOnly value={link} className="font-mono text-xs" />
          <Button variant="ghost" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
        <Button asChild className="w-full">
          <a href="/contractors">Back to contractors</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={f.name} onChange={set('name')} placeholder="João Silva" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" value={f.email} onChange={set('email')} placeholder="joao@example.com" />
        </div>
        <div>
          <Label htmlFor="role">Role / scope (optional)</Label>
          <Input id="role" value={f.role} onChange={set('role')} placeholder="Designer" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min">Min (USDC/mo)</Label>
          <Input id="min" type="number" value={f.minUsdc} onChange={set('minUsdc')} />
        </div>
        <div>
          <Label htmlFor="max">Max (USDC/mo)</Label>
          <Input id="max" type="number" value={f.maxUsdc} onChange={set('maxUsdc')} />
        </div>
      </div>
      <Button className="w-full" disabled={busy} onClick={invite}>
        {busy ? 'Creating…' : 'Create invite link'}
      </Button>
      <p className="text-xs text-muted">
        The CPF/document and wallet are provided by the collaborator when they accept — you never
        handle their keys.
      </p>
    </div>
  );
}
