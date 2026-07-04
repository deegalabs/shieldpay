'use client';

import { useEffect, useState } from 'react';
import {
  usePrivy,
  useLoginWithEmail,
  useLoginWithOAuth,
  useLoginWithPasskey,
  useConnectWallet,
} from '@privy-io/react-auth';
import { Mail, KeyRound, Wallet, ShieldCheck, Lock, Fingerprint, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Role = 'company' | 'worker';

// Intent survives an OAuth redirect (Google leaves and returns to this page), so
// the Privy -> session bridge below still knows the return was intentful.
const INTENT_KEY = 'shieldpay:login-intent';

export function AuthPanel({ mode }: { mode: 'login' | 'signup' }) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  // Each method now drives its own Privy flow directly in our card instead of
  // opening the generic Privy modal: email is an inline one-time-code step,
  // Google is a headless OAuth redirect, passkey and wallet are direct prompts.
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { initOAuth } = useLoginWithOAuth();
  const { loginWithPasskey } = useLoginWithPasskey();
  const { connectWallet } = useConnectWallet();

  // The Privy sign-in bridges into a company session by default. Contributors
  // arrive through an invite link and auditors through a time-boxed access link,
  // so this screen self-serves the company path (the demo row below covers the
  // other roles). The bridge mechanism itself is unchanged.
  const [role] = useState<Role>('company');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [intent, setIntentState] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Consume any intent persisted before an OAuth redirect. Reading it once (and
  // clearing it) keeps a cancelled flow from lingering across future visits.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(INTENT_KEY) === '1') {
      setIntentState(true);
      sessionStorage.removeItem(INTENT_KEY);
    }
  }, []);

  function markIntent() {
    if (typeof window !== 'undefined') sessionStorage.setItem(INTENT_KEY, '1');
    setIntentState(true);
  }

  function clearIntent() {
    if (typeof window !== 'undefined') sessionStorage.removeItem(INTENT_KEY);
    setIntentState(false);
  }

  function nextDest(r: string) {
    const p = new URLSearchParams(window.location.search);
    return p.get('next') || (r === 'company' ? '/dashboard' : '/payments');
  }

  // Exchange the Privy session for our own (role-scoped) session cookie, but
  // only after an intentful login. Gating on `intent` avoids bridging a user
  // who just wanted to sign out while a Privy session is still cached.
  useEffect(() => {
    if (!intent || !authenticated || busy === 'bridge') return;
    (async () => {
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
        clearIntent();
        window.location.href = nextDest(data.role);
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
        setBusy(null);
        clearIntent();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, authenticated]);

  const errMsg = (e: unknown) => String(e instanceof Error ? e.message : e);

  // Email, step 1: send the one-time code to the address in the card.
  async function handleEmailSend() {
    setError(null);
    setNote(null);
    if (authenticated) {
      markIntent();
      return;
    }
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setBusy('email-send');
    try {
      await sendCode({ email: email.trim() });
      setCodeSent(true);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  // Email, step 2: verify the code. On success Privy flips `authenticated` and
  // the bridge effect above takes over.
  async function handleEmailVerify() {
    setError(null);
    if (!code.trim()) {
      setError('Enter the code we emailed you.');
      return;
    }
    setBusy('email-verify');
    markIntent();
    try {
      await loginWithCode({ code: code.trim() });
    } catch (e) {
      setError(errMsg(e));
      clearIntent();
      setBusy(null);
    }
  }

  function resetEmail() {
    setCodeSent(false);
    setCode('');
    setError(null);
  }

  async function handleGoogle() {
    setError(null);
    setNote(null);
    if (authenticated) {
      markIntent();
      return;
    }
    setBusy('google');
    markIntent();
    try {
      // Full-page redirect; on return the persisted intent replays the bridge.
      await initOAuth({ provider: 'google' });
    } catch (e) {
      setError(errMsg(e));
      clearIntent();
      setBusy(null);
    }
  }

  async function handlePasskey() {
    setError(null);
    setNote(null);
    if (authenticated) {
      markIntent();
      return;
    }
    setBusy('passkey');
    markIntent();
    try {
      await loginWithPasskey();
    } catch (e) {
      setError(errMsg(e));
      clearIntent();
      setBusy(null);
    }
  }

  function handleWallet() {
    setError(null);
    setNote(null);
    if (authenticated) {
      markIntent();
      return;
    }
    markIntent();
    // Opens Privy's wallet connector; the signature authenticates and the
    // bridge effect fires once `authenticated` is true.
    connectWallet();
  }

  async function demo(r: Role) {
    setBusy('demo');
    setError(null);
    setNote(null);
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

  const headline = mode === 'signup' ? 'Create your account' : 'Welcome back';
  const emailCta = mode === 'signup' ? 'Get started with email' : 'Continue with email';
  const disabled = !ready || !!busy;
  const signingIn = busy === 'bridge';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Ambient wash: indigo -> emerald -> transparent, light, never paint. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 blur-[60px]"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.05) 50%, rgba(2,6,23,0) 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* ---------------------------------------------------------------- */}
        {/* Login card (one responsive layout for mobile and desktop)         */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col gap-8 rounded-xl border border-white/5 border-t-white/15 bg-surface-3/40 p-6 backdrop-blur-[24px] sm:p-8 md:p-10">
          {/* Header */}
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-2.5">
              {/* The app icon (same gradient shield as the favicon and install). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="" width={36} height={36} className="size-9" />
              <span className="font-headline text-headline-lg-mobile tracking-tight text-foreground">
                ShieldPay
              </span>
            </div>
            <div className="text-center">
              <h1 className="mb-2 font-headline text-headline-lg-mobile text-foreground md:text-headline-lg">
                {headline}
              </h1>
              <p className="font-body text-fg-subtle">Confidential Ledger Technology.</p>
            </div>
          </div>

          {/* Email + primary action (inline one-time-code step) */}
          <div className="flex flex-col gap-4">
            {!codeSent ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="pl-1 font-mono text-mono-label uppercase tracking-widest text-fg-subtle"
                  >
                    Email Address
                  </label>
                  <div className="flex h-12 items-center rounded-lg border border-border bg-surface-base/60 px-4 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25">
                    <Mail size={18} className="mr-3 shrink-0 text-fg-subtle" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full border-none bg-transparent font-mono text-mono-data text-fg-default outline-none placeholder:text-fg-faint focus:ring-0"
                    />
                  </div>
                </div>

                <Button size="lg" className="w-full" disabled={disabled} onClick={handleEmailSend}>
                  {busy === 'email-send' ? 'Sending code…' : signingIn ? 'Signing in…' : emailCta}
                  {busy !== 'email-send' && !signingIn && <ArrowRight size={16} />}
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="code"
                    className="pl-1 font-mono text-mono-label uppercase tracking-widest text-fg-subtle"
                  >
                    Enter the code sent to {email}
                  </label>
                  <div className="flex h-12 items-center rounded-lg border border-border bg-surface-base/60 px-4 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25">
                    <KeyRound size={18} className="mr-3 shrink-0 text-fg-subtle" />
                    <input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      className="w-full border-none bg-transparent font-mono text-mono-data tracking-[0.3em] text-fg-default outline-none placeholder:text-fg-faint focus:ring-0"
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  disabled={disabled}
                  onClick={handleEmailVerify}
                >
                  {busy === 'email-verify' || signingIn ? 'Verifying…' : 'Verify and continue'}
                  {busy !== 'email-verify' && !signingIn && <ArrowRight size={16} />}
                </Button>
                <button
                  type="button"
                  onClick={resetEmail}
                  disabled={!!busy}
                  className="font-mono text-mono-label uppercase tracking-widest text-fg-subtle transition-colors hover:text-brand-text disabled:opacity-50"
                >
                  Use a different email
                </button>
              </>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger-text">
              {error}
            </p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-mono-label uppercase text-fg-subtle">Or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Alternative auth methods, each wired to its own Privy flow */}
          <div className="flex flex-col gap-3">
            <Button
              variant="ghost"
              size="lg"
              disabled={disabled}
              onClick={handleGoogle}
              className="w-full gap-3 bg-surface-3 font-body text-fg-default hover:bg-surface-overlay"
            >
              <GoogleIcon />
              {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              disabled={disabled}
              onClick={handlePasskey}
              className="w-full gap-3 bg-surface-3 font-body text-fg-default hover:bg-surface-overlay"
            >
              <KeyRound size={18} className="text-brand-text" />
              {busy === 'passkey' ? 'Waiting for passkey…' : 'Sign in with a passkey'}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              disabled={disabled}
              onClick={handleWallet}
              className="w-full gap-3 bg-surface-3 font-body text-fg-default hover:bg-surface-overlay"
            >
              <Wallet size={18} className="text-verified-text" />
              Connect a wallet
            </Button>
          </div>

          {/* Trust note + role row */}
          <div className="mt-2 flex flex-col items-center gap-4">
            {/* Fits one line where there is room; on a narrow phone it wraps
                inside the card instead of overflowing past its edges. */}
            <div className="flex max-w-full items-center gap-2 rounded-2xl border border-border bg-surface-lowest px-3 py-2">
              <ShieldCheck size={14} className="shrink-0 text-verified-text" />
              <span className="min-w-0 text-center font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
                No seed phrases. Your key, your funds.
              </span>
            </div>

            <DemoRow busy={busy} onDemo={demo} onAuditor={setNote} />

            {note && (
              <p className="max-w-[280px] text-center font-body text-xs text-fg-subtle">{note}</p>
            )}
          </div>
        </div>


        {/* Quiet cross-navigation between the two entry routes. */}
        <p className="mt-6 text-center text-sm text-fg-subtle">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <a className="font-medium text-brand-text hover:underline" href="/login">
                Sign in
              </a>
            </>
          ) : (
            <>
              New to ShieldPay?{' '}
              <a className="font-medium text-brand-text hover:underline" href="/signup">
                Create an account
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Company / Contributor demo entries plus the honest auditor note. */
/**
 * Demo entry: one button. Real sign-in above routes each persona automatically,
 * so the demo needs no role picker here; it opens the company view and the
 * in-app "Demo view" switch flips to the contributor without signing out.
 * Auditor is not a login, it is a read-only link a company shares.
 */
function DemoRow({
  busy,
  onDemo,
  onAuditor,
}: {
  busy: string | null;
  onDemo: (r: Role) => void;
  onAuditor: (n: string) => void;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2">
      <Button
        variant="ghost"
        size="lg"
        className="w-full"
        disabled={!!busy}
        onClick={() => onDemo('company')}
      >
        {busy === 'demo' ? 'Opening the demo…' : 'Explore the demo'}
      </Button>
      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-fg-faint">
        Switch between company and contributor inside. Auditor access is a{' '}
        <button
          type="button"
          onClick={() =>
            onAuditor(
              'Auditor access is a read-only link a company shares. Open the demo and use Auditor access to try it.',
            )
          }
          className="text-fg-subtle underline-offset-2 transition-colors hover:text-brand-text hover:underline"
        >
          read-only link
        </button>
        .
      </p>
    </div>
  );
}

/** Self-contained Google "G" mark (no external asset, CSP-safe). */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
