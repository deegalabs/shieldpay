'use client';

import { useState } from 'react';

/**
 * Login — all MVP auth methods in one place:
 *   1. Demo (one-click, no wallet)   — guaranteed to work for the demo
 *   2. Stellar wallet (Freighter)    — sign a challenge
 *   3. Passkey (WebAuthn)            — biometric / device
 *   4. Magic link (email)            — dev mode returns the link
 */
export default function LoginPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('company');

  function nextDest(role: string) {
    const params = new URLSearchParams(window.location.search);
    return params.get('next') || (role === 'company' ? '/dashboard' : '/payments');
  }
  function go(role: string) {
    window.location.href = nextDest(role);
  }
  function fail(e: unknown) {
    setError(String(e instanceof Error ? e.message : e));
    setBusy(null);
  }

  async function demo(role: 'company' | 'worker') {
    setBusy('demo');
    setError(null);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('demo login failed');
      go(role);
    } catch (e) {
      fail(e);
    }
  }

  async function freighter() {
    setBusy('wallet');
    setError(null);
    try {
      const fr: any = await import('@stellar/freighter-api');
      const access = fr.requestAccess ? await fr.requestAccess() : await fr.getAddress();
      const address = access.address || access.publicKey;
      if (!address) throw new Error(access.error || 'no address from wallet');

      const ch = await (await fetch(`/api/auth/challenge?address=${address}`)).json();
      const signed = await fr.signMessage(ch.message, { address });
      const signature = signed.signedMessage || signed.signature;

      const res = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address, message: ch.message, signature, challengeToken: ch.challengeToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'wallet login failed');
      go(data.role);
    } catch (e) {
      fail(e);
    }
  }

  async function passkey(mode: 'register' | 'login') {
    setBusy('passkey');
    setError(null);
    try {
      const browser: any = await import('@simplewebauthn/browser');
      const optRes = await fetch(`/api/auth/passkey/${mode}?handle=${encodeURIComponent(handle)}`);
      const options = await optRes.json();
      const response =
        mode === 'register'
          ? await browser.startRegistration(options)
          : await browser.startAuthentication(options);
      const res = await fetch(`/api/auth/passkey/${mode}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ handle, response, role: 'company' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'passkey failed');
      go(data.role);
    } catch (e) {
      fail(e);
    }
  }

  async function magic(role: 'company' | 'worker') {
    setBusy('magic');
    setError(null);
    setMagicLink(null);
    try {
      const res = await fetch('/api/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'magic link failed');
      if (data.link) setMagicLink(data.link);
      else setError('Magic link sent to your email.');
      setBusy(null);
    } catch (e) {
      fail(e);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold">Sign in to ShieldPay</h1>
      <p className="mt-2 text-sm text-muted">Choose how you want to authenticate.</p>

      {error && <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-sm text-warning">{error}</p>}

      {/* Demo */}
      <section className="card mt-6 space-y-3">
        <p className="text-sm font-medium">Demo (no wallet)</p>
        <div className="flex gap-3">
          <button className="btn-primary flex-1" disabled={!!busy} onClick={() => demo('company')}>
            Enter as Company
          </button>
          <button className="btn-ghost flex-1" disabled={!!busy} onClick={() => demo('worker')}>
            Enter as Worker
          </button>
        </div>
      </section>

      {/* Wallet */}
      <section className="card mt-4 space-y-3">
        <p className="text-sm font-medium">Stellar wallet (Freighter)</p>
        <button className="btn-ghost w-full" disabled={!!busy} onClick={freighter}>
          Connect Freighter & sign
        </button>
      </section>

      {/* Passkey */}
      <section className="card mt-4 space-y-3">
        <p className="text-sm font-medium">Passkey (biometric / device)</p>
        <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" />
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" disabled={!!busy} onClick={() => passkey('register')}>
            Register
          </button>
          <button className="btn-ghost flex-1" disabled={!!busy} onClick={() => passkey('login')}>
            Sign in
          </button>
        </div>
      </section>

      {/* Magic link */}
      <section className="card mt-4 space-y-3">
        <p className="text-sm font-medium">Magic link (email)</p>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" disabled={!!busy} onClick={() => magic('company')}>
            Link as Company
          </button>
          <button className="btn-ghost flex-1" disabled={!!busy} onClick={() => magic('worker')}>
            Link as Worker
          </button>
        </div>
        {magicLink && (
          <a className="block break-all text-sm text-accent hover:underline" href={magicLink}>
            Dev link → {magicLink}
          </a>
        )}
      </section>
    </main>
  );
}
