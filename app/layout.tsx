import type { Metadata, Viewport } from 'next';
import { Inter, Public_Sans, Space_Grotesk, Space_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { ServiceWorkerManager } from '@/components/pwa/service-worker-manager';
import { TopLoadingBar } from '@/components/ui/top-loading-bar';
import './globals.css';

// Confidential Ledger type system. Inter carries body + UI labels; Space Grotesk
// is the editorial headline face; Space Mono is the "source of truth" font for
// ids, hashes, addresses, amounts, and overline labels. Each exposes a CSS var
// wired into tailwind.config fontFamily.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
// Public Sans carries the reference "font-label" face (nav labels, uppercase
// tracked micro-labels, button labels). Weights match the Stitch export.
const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-public-sans',
  display: 'swap',
});
const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-grotesk',
  display: 'swap',
});
// Space Mono ships only 400 and 700; the mono-label weight (500) resolves to the
// nearest available face.
const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShieldPay | Payroll & Payment Proof on Stellar',
  description:
    'Pay anyone in the world. Prove mathematically that you paid. Protect your company forever.',
  applicationName: 'ShieldPay',
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { capable: true, title: 'ShieldPay', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
};

// Drives the mobile browser chrome color and a correct responsive viewport.
// viewportFit: cover lets content use the iOS safe-area insets the app relies on.
export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${publicSans.variable} ${grotesk.variable} ${mono.variable}`}
    >
      <body className="min-h-screen font-sans">
        <TopLoadingBar />
        <Providers>{children}</Providers>
        <Toaster theme="dark" position="top-right" richColors />
        <InstallPrompt />
        <ServiceWorkerManager />
      </body>
    </html>
  );
}
