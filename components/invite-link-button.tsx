'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check, Mail, Loader2 } from 'lucide-react';

/**
 * Invite actions for an invited contributor: copy the link, and (when we have
 * their email) send the invite by email. Both re-mint a fresh 30-day link.
 */
export function InviteLinkButton({ id, email }: { id: string; email?: string | null }) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

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

  async function sendEmail(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSending(true);
    try {
      const res = await fetch(`/api/contractors/${id}/invite-email`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 501) {
        toast.error('Email delivery is not set up yet. Copy the link to share it.');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'could not send email');
      toast.success(`Invite emailed${email ? ` to ${email}` : ''}`);
    } catch (err) {
      toast.error(String(err instanceof Error ? err.message : err));
    } finally {
      setSending(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-3">
      {email && (
        <button
          onClick={sendEmail}
          disabled={sending}
          className="inline-flex items-center gap-1 text-sm text-brand-text hover:underline disabled:opacity-60"
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />} Email invite
        </button>
      )}
      <button
        onClick={copy}
        className="inline-flex items-center gap-1 text-sm text-brand-text hover:underline"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />} Copy invite
      </button>
    </span>
  );
}
