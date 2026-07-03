import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Space_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import './globals.css';

// Confidential Ledger type system. Inter carries body + UI labels; Space Grotesk
// is the editorial headline face; Space Mono is the "source of truth" font for
// ids, hashes, addresses, amounts, and overline labels. Each exposes a CSS var
// wired into tailwind.config fontFamily.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${grotesk.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
