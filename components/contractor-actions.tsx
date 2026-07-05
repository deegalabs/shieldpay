'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { startTopLoading, stopTopLoading } from '@/components/ui/top-loading-bar';

export function ContractorActions({ id, anchored }: { id: string; anchored: boolean }) {
  const [busy, setBusy] = useState(false);
  const [isAnchored, setIsAnchored] = useState(anchored);
  const confirm = useConfirm();

  async function anchor() {
    setBusy(true);
    try {
      const res = await fetch(`/api/contractors/${id}/anchor`, { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      setIsAnchored(true);
      toast.success('Identity marked as anchored');
    } catch {
      toast.error('Could not anchor');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: 'Remove contributor',
      description:
        'They will be removed from your workspace. Their past payments and on-chain proofs stay intact and verifiable.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    startTopLoading();
    try {
      const res = await fetch(`/api/contractors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      toast.success('Contributor removed');
      // Keep the bar running through the redirect (the page unloads next).
      window.location.href = '/contractors';
    } catch {
      stopTopLoading();
      toast.error('Could not remove');
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      {!isAnchored && (
        <Button variant="ghost" size="sm" disabled={busy} onClick={anchor}>
          Mark identity anchored
        </Button>
      )}
      <Button variant="ghost" size="sm" disabled={busy} onClick={remove}>
        Remove
      </Button>
    </div>
  );
}
