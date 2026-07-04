'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';

/**
 * App providers. Wraps the tree in Privy for professional, seedless auth
 * (email / Google / passkey) and the app-wide confirmation modal. If the app id
 * is missing, render children (still with ConfirmProvider) so the app runs
 * without Privy configured.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return <ConfirmProvider>{children}</ConfirmProvider>;

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
      <ConfirmProvider>{children}</ConfirmProvider>
    </PrivyProvider>
  );
}
