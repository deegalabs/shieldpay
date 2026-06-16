import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShieldPay — Payroll & Payment Proof on Stellar',
  description:
    'Pay anyone in the world. Prove mathematically that you paid. Protect your company forever.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
