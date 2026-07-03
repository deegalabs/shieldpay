'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';

/** Re-mints and copies an invite link for an invited contractor. */
export function InviteLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/contractors/${id}/invite-link`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      await navigator.clipboard?.writeText(data.url).catch(() => {});
      setCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast.error(String(err instanceof Error ? err.message : err));
    }
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-sm text-brand-text hover:underline"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />} Copy invite
    </button>
  );
}
