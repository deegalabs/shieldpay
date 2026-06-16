'use client';

import { PrivyProvider } from '@privy-io/react-auth';

/**
 * App providers. Wraps the tree in Privy for professional, seedless auth
 * (email / Google / passkey). If the app id is missing, render children
 * untouched so the app still builds/runs without Privy configured.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return <>{children}</>;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#6366F1',
          logo: undefined,
        },
        loginMethods: ['email', 'google', 'passkey'],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
