'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Company-side: invite a collaborator. On success shows the shareable link. */
export function InviteForm() {
  const [f, setF] = useState({ name: '', email: '', role: '', min: '', max: '' });
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function invite() {
    const minUsdc = Number(f.min);
    const maxUsdc = Number(f.max);
    if (f.name.trim().length < 2) return toast.error('Name is required');
    if (!f.email.includes('@')) return toast.error('A valid email is required');
    if (!(maxUsdc > 0) || minUsdc < 0 || minUsdc > maxUsdc) return toast.error('Enter a valid range');

    setBusy(true);
    try {
      const res = await fetch('/api/contractors/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: f.name, email: f.email, role: f.role, minUsdc, maxUsdc }),
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
          Invite created. Send this link to <span className="text-foreground">{f.email}</span>,
          they accept, a wallet is created for them, and they anchor their identity.
        </p>
        <div className="flex items-center gap-2">
          <Input readOnly value={link} className="font-mono text-xs" />
          <Button variant="ghost" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
        <p className="text-xs text-muted">
          (Automatic email delivery is coming next, for now, share the link.)
        </p>
        <Button asChild className="w-full">
          <a href="/contractors">Back to collaborators</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={f.name} onChange={set('name')} placeholder="Jane Doe" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={f.email} onChange={set('email')} placeholder="joao@example.com" />
      </div>
      <div>
        <Label htmlFor="role">Role / scope (optional)</Label>
        <Input id="role" value={f.role} onChange={set('role')} placeholder="Designer" />
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
      <Button className="w-full" disabled={busy} onClick={invite}>
        {busy ? 'Creating…' : 'Create invite link'}
      </Button>
      <p className="text-xs text-muted">
        The ID/CPF and wallet are provided by the collaborator when they accept, you never handle
        their keys.
      </p>
    </div>
  );
}
