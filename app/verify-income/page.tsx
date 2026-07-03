import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-mark';
import { VerifyIncomePanel } from '@/components/verify-income-panel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify a proof of income · ShieldPay',
  description:
    'Confirm a ShieldPay proof of income straight from the Stellar network. No wallet, no account, no monthly amounts revealed.',
};

export default function VerifyIncomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
              <BrandMark size={18} />
            </span>
            <span className="font-semibold tracking-tight text-fg-default">ShieldPay</span>
            <span className="overline ml-1 hidden sm:inline">Confidential</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-fg-subtle transition hover:text-fg-default"
          >
            <ArrowLeft size={15} /> Return to dashboard
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-[600px] px-6 py-16 sm:py-24">
        {/* Atmospheric brand glow behind the hero. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/5 blur-[100px]"
        />

        <div className="mb-10 text-center">
          <p className="overline text-brand-text">Proof of income</p>
          <h1 className="ambient-glow mt-4 font-mono text-3xl font-semibold leading-tight tracking-tight text-fg-default sm:text-[2.5rem]">
            Verified on-chain, amount private.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-fg-subtle">
            An employer attested this person&apos;s income within an agreed range. Confirm it
            yourself, right here, without an account, and without seeing any exact amount.
          </p>
        </div>

        <VerifyIncomePanel />
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        ShieldPay · Confidential payroll on Stellar
      </footer>
    </div>
  );
}
