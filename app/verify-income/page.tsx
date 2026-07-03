import Link from 'next/link';
import type { Metadata } from 'next';
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
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
              <BrandMark size={18} />
            </span>
            <span className="font-semibold tracking-tight text-fg-default">ShieldPay</span>
          </Link>
          <Link
            href="/help"
            className="rounded-lg px-3 py-2 text-sm text-fg-subtle transition hover:text-fg-default"
          >
            Help
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <div className="mb-10 text-center">
          <span className="overline">Proof of income</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg-default sm:text-4xl">
            Verified on-chain, amount private
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-fg-subtle">
            An employer attested this person&apos;s income within an agreed range. Confirm it
            yourself, right here, without an account, and without seeing any exact amount.
          </p>
        </div>
        <VerifyIncomePanel />
      </main>
    </div>
  );
}
