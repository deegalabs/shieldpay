'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/** Topbar actions for the company app: mint an auditor link, and log out. */
export function TopbarActions({ canAudit = false }: { canAudit?: boolean }) {
  const [busy, setBusy] = useState(false);

  async function auditorLink() {
    setBusy(true);
    try {
      const res = await fetch('/api/auth/auditor-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ days: 30 }),
      });
      const data = await res.json();
      if (res.ok) {
        const url = `${window.location.origin}${data.url}`;
        await navigator.clipboard?.writeText(url).catch(() => {});
        toast.success('Auditor link copied', { description: `Valid ${data.expiresInDays} days` });
      } else {
        toast.error(data.error || 'Could not create link');
      }
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="flex items-center gap-2">
      {canAudit && (
        <Button variant="ghost" size="sm" disabled={busy} onClick={auditorLink}>
          Auditor link
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}
