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
            <span className="font-semibold tracking-tight">ShieldPay</span>
          </Link>
          <Link href="/help" className="px-3 py-2 text-sm text-muted hover:text-foreground">
            Help
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Proof of income, verified on-chain</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            An employer attested this person&apos;s income within an agreed range. Confirm it yourself,
            right here, without an account, and without seeing any exact amount.
          </p>
        </div>
        <VerifyIncomePanel />
      </main>
    </div>
  );
}
