'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function ContractorActions({ id, anchored }: { id: string; anchored: boolean }) {
  const [busy, setBusy] = useState(false);
  const [isAnchored, setIsAnchored] = useState(anchored);

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
    if (!confirm('Remove this contractor?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contractors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      window.location.href = '/contractors';
    } catch {
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
