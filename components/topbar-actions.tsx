'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { KeyRound, ChevronDown, LogOut, Link2, Eye, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/components/ui/confirm-dialog';

/** Topbar actions for the company app: an auditor-access menu and log out. */
export function TopbarActions({ canAudit = false }: { canAudit?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const confirm = useConfirm();

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
    const ok = await confirm({
      title: 'Revoke disclosure links',
      description:
        'Every viewing-key link drops to read-only. Auditors keep read-only access and you can issue new links anytime.',
      confirmLabel: 'Revoke',
      destructive: true,
    });
    if (!ok) return;
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
    <>
      {/* Desktop (sidebar footer): compact 2-button grid with a nested auditor
          dropdown that opens upward. */}
      <div className={cn('hidden gap-2 md:grid', canAudit ? 'grid-cols-2' : 'grid-cols-1')}>
        {canAudit && (
          <div className="relative" ref={ref}>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={open}
              className={cn(
                'flex w-full items-center justify-between gap-1.5 rounded-md border px-3 py-2',
                'border-slate-700/60 bg-slate-800/40 text-slate-300',
                'transition-colors duration-150 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
                'disabled:cursor-not-allowed disabled:opacity-60',
                open && 'border-indigo-500/50 bg-slate-800 text-slate-100',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <KeyRound size={14} className="shrink-0 text-indigo-400" />
                <span className="truncate font-mono text-[11px] uppercase tracking-wider">Auditor</span>
              </span>
              <ChevronDown
                size={14}
                className={cn('shrink-0 text-slate-500 transition-transform duration-150', open && 'rotate-180')}
              />
            </button>
            {open && (
              <div
                role="menu"
                className="absolute bottom-full left-0 z-50 mb-2 w-72 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.75)]"
              >
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
                <div className="mx-2 my-1 h-px bg-slate-800" />
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
        <button
          type="button"
          onClick={logout}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2',
            'border-slate-700/60 bg-slate-800/40 text-slate-300',
            'transition-colors duration-150 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
          )}
        >
          <LogOut size={14} className="shrink-0" />
          <span className="font-mono text-[11px] uppercase tracking-wider">Log out</span>
        </button>
      </div>

      {/* Mobile (account menu): a flat list, no nested dropdown. The auditor
          actions and log out sit directly in the account sheet. */}
      <div className="flex flex-col md:hidden">
        {canAudit && (
          <>
            <FlatItem icon={<Link2 size={15} />} title="Copy auditor link" onClick={() => auditorLink(false)} disabled={busy} />
            <FlatItem icon={<Eye size={15} />} title="Copy viewing-key link" onClick={() => auditorLink(true)} disabled={busy} />
            <FlatItem icon={<RotateCcw size={15} />} title="Revoke disclosure links" danger onClick={revokeDisclosure} disabled={busy} />
            <div className="mx-1 my-1 h-px bg-slate-800" />
          </>
        )}
        <FlatItem icon={<LogOut size={15} />} title="Log out" onClick={logout} />
      </div>
    </>
  );
}

/** A flat, full-width row for the mobile account menu (no nested popover). */
function FlatItem({
  icon,
  title,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100',
      )}
    >
      <span className={cn('shrink-0', danger ? 'text-red-400' : 'text-indigo-400')}>{icon}</span>
      <span>{title}</span>
    </button>
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
