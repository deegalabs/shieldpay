'use client';

import dynamic from 'next/dynamic';

// The auth panel depends on Privy hooks that only run in the browser, so it is
// mounted client-side only. This keeps the login and signup pages out of static
// prerendering, which the Privy login hook does not support.
const AuthPanel = dynamic(() => import('./auth-panel').then((m) => m.AuthPanel), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
      <div className="h-64 w-full animate-pulse rounded-xl border border-border bg-surface-2/40" />
    </div>
  ),
});

export function AuthPanelMount({ mode }: { mode: 'login' | 'signup' }) {
  return <AuthPanel mode={mode} />;
}
