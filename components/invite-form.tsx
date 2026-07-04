'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check, Contact, Mail, Lock, ShieldCheck, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { SealedChip } from '@/components/ui/sealed-chip';

/** Roles offered by the mobile select. Values are stored verbatim as the role string. */
const ROLE_OPTIONS = [
  'Senior Engineer',
  'Product Designer',
  'Product Manager',
  'Operations',
  'Finance',
  'Contributor',
] as const;

/** Floor a dollar string to whole thousands for the ledger preview chip ($0k until filled). */
function toK(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n / 1000) : 0;
}

/** Company-side: invite a collaborator. On success shows the shareable link. */
export function InviteForm() {
  const [f, setF] = useState({ name: '', email: '', role: '', min: '', max: '' });
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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

  // Shared success view (both layouts): the invite link is ready to share.
  if (link) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <p className="text-sm text-fg-subtle">
            Invite created. Send this link to <span className="text-fg-default">{f.email}</span>, they
            accept, a wallet is created for them, and they anchor their identity.
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={link} className="font-mono text-xs" />
            <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy invite link">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
          <p className="text-xs text-fg-subtle">
            (Automatic email delivery is coming next, for now, share the link.)
          </p>
          <Button asChild className="h-12 w-full">
            <a href="/contractors">Back to collaborators</a>
          </Button>
        </div>
      </Card>
    );
  }

  // Live ledger-preview values, mirrored from the shared form state.
  const previewName = f.name.trim() || 'New Contributor';
  const previewRole = f.role || 'Role Pending';
  const rangeLabel = `$${toK(f.min)}k-${toK(f.max)}k`;

  return (
    <>
      {/* -------------------------------------------------------------------- */}
      {/* Desktop layout (md+): the original field stack, unchanged behaviour.  */}
      {/* -------------------------------------------------------------------- */}
      <Card className="hidden p-6 md:block">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={f.name} onChange={set('name')} placeholder="Jane Doe" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={f.email}
              onChange={set('email')}
              placeholder="joao@example.com"
            />
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
          <p className="text-xs text-fg-subtle">
            The ID/CPF and wallet are provided by the collaborator when they accept, you never handle
            their keys.
          </p>
        </div>
      </Card>

      {/* -------------------------------------------------------------------- */}
      {/* Mobile layout (below md): the approved Stitch print. Same state.     */}
      {/* -------------------------------------------------------------------- */}
      <div className="md:hidden">
        <div className="mb-6 space-y-2">
          <h1 className="font-headline text-headline-lg-mobile tracking-tight text-fg-default">
            Invite Contributor
          </h1>
          <p className="text-sm leading-relaxed text-fg-subtle">
            Securely onboard a new team member. Their specific compensation will remain encrypted.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Legal name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="m-name" className="overline">
              Legal name
            </label>
            <div className="relative">
              <Input
                id="m-name"
                value={f.name}
                onChange={set('name')}
                placeholder="E.g. Jane Doe"
                className="h-12 pr-11"
              />
              <Contact
                size={18}
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="m-email" className="overline">
              Email address
            </label>
            <div className="relative">
              <Input
                id="m-email"
                type="email"
                value={f.email}
                onChange={set('email')}
                placeholder="jane@example.com"
                className="h-12 pr-11"
              />
              <Mail
                size={18}
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint"
              />
            </div>
          </div>

          {/* Role / title */}
          <div className="flex flex-col gap-2">
            <label htmlFor="m-role" className="overline">
              Role / title
            </label>
            <Select value={f.role || undefined} onValueChange={(v) => setF({ ...f, role: v })}>
              <SelectTrigger id="m-role" className="h-12">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compensation range */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="overline">Compensation range</span>
              <span className="mono inline-flex items-center gap-1 text-xs uppercase tracking-widest text-brand-text">
                <Lock size={12} aria-hidden /> Encrypted
              </span>
            </div>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <span className="mono pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">
                  $
                </span>
                <Input
                  id="m-min"
                  inputMode="decimal"
                  value={f.min}
                  onChange={set('min')}
                  placeholder="Min"
                  aria-label="Minimum monthly USDC"
                  className="h-12 pl-7"
                />
              </div>
              <div className="relative flex-1">
                <span className="mono pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">
                  $
                </span>
                <Input
                  id="m-max"
                  inputMode="decimal"
                  value={f.max}
                  onChange={set('max')}
                  placeholder="Max"
                  aria-label="Maximum monthly USDC"
                  className="h-12 pl-7"
                />
              </div>
            </div>
          </div>

          <div className="my-1 h-px w-full bg-border" />

          {/* Ledger preview: live reflection of the new contributor. */}
          <div className="flex flex-col gap-3">
            <span className="overline">Ledger preview</span>
            <div className="top-edge flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-base">
                  <User size={16} className="text-fg-subtle" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-fg-default">{previewName}</span>
                  <span className="mono truncate text-xs text-fg-subtle">{previewRole}</span>
                </div>
              </div>
              <SealedChip label={rangeLabel} size="md" className="shrink-0" />
            </div>
          </div>

          {/* Self-anchoring keys note. */}
          <div className="flex items-start gap-3 rounded-lg border-l-2 border-verified bg-surface-2 p-4">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-verified-text" aria-hidden />
            <p className="text-sm leading-relaxed text-fg-subtle">
              The contributor will be prompted to generate self-anchoring keys upon accepting this
              invite. This ensures absolute confidentiality on the ledger.
            </p>
          </div>

          {/* Two-step progress: 01 Setup (active) -> 02 Send. */}
          <div className="flex flex-col gap-1.5 pt-2">
            <div className="mono flex justify-between text-xs uppercase tracking-widest">
              <span className="text-brand-text">01 Setup</span>
              <span className="text-fg-subtle">02 Send</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand to-verified" />
            </div>
          </div>

          {/* Primary action: shares the same handler and state as desktop. */}
          <Button className="h-12 w-full" disabled={busy} onClick={invite}>
            <Send size={16} aria-hidden />
            {busy ? 'Sending…' : 'Send Invite'}
          </Button>
        </div>
      </div>
    </>
  );
}
