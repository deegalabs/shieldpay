'use client';

import { useState } from 'react';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { ShieldCheck, Mail, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Role = 'company' | 'worker';

export function AuthPanel({ mode }: { mode: 'login' | 'signup' }) {
  const { ready, getAccessToken } = usePrivy();
  const [role, setRole] = useState<Role>('company');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function nextDest(r: string) {
    const p = new URLSearchParams(window.location.search);
    return p.get('next') || (r === 'company' ? '/dashboard' : '/payments');
  }

  // Exchange the Privy session for our own (role-scoped) session cookie. Runs
  // from the useLogin onComplete callback, the recommended v3 pattern, instead
  // of watching `authenticated` in an effect.
  async function bridge() {
    setBusy('bridge');
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/auth/privy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'login failed');
      window.location.href = nextDest(data.role);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setBusy(null);
    }
  }

  const { login } = useLogin({
    onComplete: () => void bridge(),
    onError: (err) => {
      // Closing the Privy modal is not an error worth surfacing.
      if (err !== 'exited_auth_flow' && err !== 'generic_connect_wallet_error') {
        setError(typeof err === 'string' ? err.replace(/_/g, ' ') : 'login failed');
      }
      setBusy(null);
    },
  });

  function startPrivy() {
    setError(null);
    login();
  }

  async function demo(r: Role) {
    setBusy('demo');
    setError(null);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: r }),
      });
      if (!res.ok) throw new Error('demo login failed');
      window.location.href = nextDest(r);
    } catch (e) {
      setError(String(e));
      setBusy(null);
    }
  }

  const title = mode === 'signup' ? 'Create your account' : 'Welcome back';
  const cta = mode === 'signup' ? 'Create account' : 'Sign in';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand">
          <ShieldCheck size={22} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === 'signup'
            ? 'Set up payments with proof in minutes.'
            : 'Sign in to your ShieldPay workspace.'}
        </p>
      </div>

      <Card className="space-y-5 p-6">
        {/* Role */}
        <div>
          <p className="mb-2 text-sm font-medium text-muted">I am a…</p>
          <div className="grid grid-cols-2 gap-2">
            <RoleTab active={role === 'company'} onClick={() => setRole('company')} icon={<Building2 size={16} />} label="Company" />
            <RoleTab active={role === 'worker'} onClick={() => setRole('worker')} icon={<User size={16} />} label="Contractor" />
          </div>
          {mode === 'signup' && role === 'worker' && (
            <p className="mt-2 rounded-lg border border-border bg-surface-2/40 p-2.5 text-xs text-muted">
              Contractors join through an <span className="text-foreground">invite link</span> from
              their organization. Ask them to invite you, or sign in if you already accepted.
            </p>
          )}
        </div>

        {/* Primary: Privy */}
        <Button className="w-full" disabled={!ready || !!busy} onClick={startPrivy}>
          <Mail size={16} />
          {busy === 'bridge' ? 'Signing in…' : cta}
        </Button>
        <p className="text-center text-xs text-muted">
          Email, Google, or passkey. No seed phrase, a secure wallet is created for you.
        </p>

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" /> or try the demo <span className="h-px flex-1 bg-border" />
        </div>

        {/* Demo */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" disabled={!!busy} onClick={() => demo('company')}>
            Demo company
          </Button>
          <Button variant="ghost" disabled={!!busy} onClick={() => demo('worker')}>
            Demo worker
          </Button>
        </div>
      </Card>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === 'signup' ? (
          <>Already have an account? <a className="text-accent hover:underline" href="/login">Sign in</a></>
        ) : (
          <>New to ShieldPay? <a className="text-accent hover:underline" href="/signup">Create an account</a></>
        )}
      </p>
    </div>
  );
}

function RoleTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ' +
        (active
          ? 'border-brand bg-brand/10 text-foreground'
          : 'border-border text-muted hover:bg-surface-2')
      }
    >
      {icon}
      {label}
    </button>
  );
}
