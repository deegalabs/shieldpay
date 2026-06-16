'use client';

import { useState } from 'react';

/** Company header actions: mint an auditor link, and log out. */
export default function AuthActions() {
  const [link, setLink] = useState<string | null>(null);
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
      if (res.ok) setLink(`${window.location.origin}${data.url}`);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button className="btn-ghost text-sm" disabled={busy} onClick={auditorLink}>
          Auditor link
        </button>
        <button className="btn-ghost text-sm" onClick={logout}>
          Log out
        </button>
      </div>
      {link && (
        <a className="max-w-xs truncate text-xs text-accent hover:underline" href={link} target="_blank" rel="noreferrer">
          {link}
        </a>
      )}
    </div>
  );
}
