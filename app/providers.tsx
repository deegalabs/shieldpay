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
          // Show the wallet button in Privy's own connect flow too.
          walletList: ['detected_wallets', 'wallet_connect'],
        },
        // Wallet is a first-class login method so the Connect Wallet button
        // authenticates (a wallet signature creates the Privy session), not just
        // connects. Email/Google/passkey are seedless entry for everyone else.
        loginMethods: ['email', 'google', 'passkey', 'wallet'],
      }}
    >
      <ConfirmProvider>{children}</ConfirmProvider>
    </PrivyProvider>
  );
}
