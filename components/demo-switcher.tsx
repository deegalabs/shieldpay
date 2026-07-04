'use client';

import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'company' | 'worker';

/**
 * In-app demo role switch, shown only for a demo session. Flipping the segment
 * re-issues the demo session for the other role (POST /api/auth/demo) and lands
 * on that portal, so you can move between the company and contributor views
 * without signing out. Real (non-demo) sessions never render this.
 */
export function DemoSwitcher({ current }: { current: Role }) {
  const [busy, setBusy] = useState(false);

  async function switchTo(role: Role) {
    if (role === current || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('switch failed');
      window.location.href = role === 'company' ? '/dashboard' : '/payments';
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">
        <FlaskConical size={12} className="text-indigo-400" /> Demo view
      </span>
      <div
        role="group"
        aria-label="Demo role"
        className="grid grid-cols-2 gap-1 rounded-md border border-slate-700/60 bg-slate-800/40 p-1"
      >
        {(['company', 'worker'] as const).map((role) => {
          const active = current === role;
          return (
            <button
              key={role}
              type="button"
              disabled={busy}
              aria-pressed={active}
              onClick={() => switchTo(role)}
              className={cn(
                'rounded px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-60',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
              )}
            >
              {role === 'company' ? 'Company' : 'Contributor'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
