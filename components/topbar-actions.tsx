'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { KeyRound, ChevronDown, LogOut, Link2, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Topbar actions for the company app: an auditor-access menu and log out. */
export function TopbarActions({ canAudit = false }: { canAudit?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function auditorLink(disclose: boolean) {
    setBusy(true);
    setOpen(false);
    try {
      const res = await fetch('/api/auth/auditor-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ days: 30, disclose }),
      });
      const data = await res.json();
      if (res.ok) {
        const url = `${window.location.origin}${data.url}`;
        await navigator.clipboard?.writeText(url).catch(() => {});
        toast.success(disclose ? 'Viewing-key link copied' : 'Auditor link copied', {
          description: disclose
            ? `Reveals & verifies exact amounts · valid ${data.expiresInDays} days`
            : `Ranges + on-chain proofs · valid ${data.expiresInDays} days`,
        });
      } else {
        toast.error(data.error || 'Could not create link');
      }
    } finally {
      setBusy(false);
    }
  }

  async function revokeDisclosure() {
    setOpen(false);
    if (!confirm('Revoke every viewing-key link? Auditors keep read-only access, and you can issue new links.')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/auditor-link/rotate', { method: 'POST' });
      const data = await res.json();
      if (res.ok) toast.success('All viewing-key links revoked');
      else toast.error(data.error || 'Could not revoke');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="flex items-center gap-1.5">
      {canAudit && (
        <div className="relative" ref={ref}>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setOpen((o) => !o)}>
            <KeyRound size={15} /> Auditor access
            <ChevronDown size={14} className={cn('transition-transform duration-150', open && 'rotate-180')} />
          </Button>
          {open && (
            <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border-strong bg-surface-overlay shadow-[0_16px_48px_-16px_rgba(0,0,0,0.65)]">
              <MenuItem
                icon={<Link2 size={15} />}
                title="Copy auditor link"
                sub="Read-only: ranges + on-chain proofs"
                onClick={() => auditorLink(false)}
              />
              <MenuItem
                icon={<Eye size={15} />}
                title="Copy viewing-key link"
                sub="Reveals and re-verifies exact amounts"
                onClick={() => auditorLink(true)}
              />
              <div className="mx-2 my-1 h-px bg-border" />
              <MenuItem
                icon={<RotateCcw size={15} />}
                title="Revoke disclosure links"
                sub="Drops every viewing-key link to read-only"
                danger
                onClick={revokeDisclosure}
              />
            </div>
          )}
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut size={15} />
        <span className="hidden sm:inline">Log out</span>
      </Button>
    </div>
  );
}

function MenuItem({
  icon,
  title,
  sub,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition duration-150 hover:bg-surface-3"
    >
      <span className={cn('mt-0.5 shrink-0', danger ? 'text-danger-text' : 'text-brand-text')}>{icon}</span>
      <span className="min-w-0">
        <span className={cn('block text-sm font-medium', danger ? 'text-danger-text' : 'text-fg-default')}>
          {title}
        </span>
        <span className="block text-xs text-fg-faint">{sub}</span>
      </span>
    </button>
  );
}
