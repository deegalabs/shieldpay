import Link from 'next/link';
import {
  Shield,
  Terminal,
  Braces,
  CheckCircle2,
  Lock,
  BadgeCheck,
  Github,
} from 'lucide-react';
import { VerifyPanel } from '@/components/verify-panel';
import { cn } from '@/lib/utils';

/**
 * Marketing landing, reproduced 1:1 from the Stitch "Confidential Ledger" export
 * (temp/.../shieldpay_landing_desktop). The Stitch Material-3 tokens are rendered
 * here as raw standard Tailwind (slate / indigo / emerald) plus the type tokens
 * already defined in tailwind.config (font-mono, text-display-lg, text-mono-label,
 * text-mono-data, font-headline, font-body, text-body-md). No app semantic color
 * tokens on this page. Honest copy: "Live on Stellar testnet" (the app is on
 * testnet), and the range-proof nuance is kept in the subhead.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* TopNav - marketing layout */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Shield size={22} className="text-indigo-300" />
            <span className="font-headline text-headline-lg-mobile tracking-tight text-slate-100 md:text-headline-lg">
              ShieldPay
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/login"
              className="font-mono text-mono-label text-slate-400 transition-colors hover:text-indigo-300"
            >
              Product
            </Link>
            <a
              href="#verify"
              className="font-mono text-mono-label text-slate-400 transition-colors hover:text-indigo-300"
            >
              How it works
            </a>
            <a
              href="#verify"
              className="font-mono text-mono-label text-slate-400 transition-colors hover:text-indigo-300"
            >
              Proof
            </a>
            <Link
              href="/login"
              className="font-mono text-mono-label text-slate-400 transition-colors hover:text-indigo-300"
            >
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden font-mono text-mono-label uppercase text-slate-400 transition-colors hover:text-indigo-300 md:block"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded bg-indigo-300 px-6 py-2 font-body text-body-md font-medium text-indigo-950 transition-colors hover:bg-indigo-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-24 pt-32 md:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at center, rgba(128, 131, 255, 0.15) 0%, rgba(78, 222, 163, 0.05) 50%, transparent 100%)',
          }}
        />
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Hero copy */}
          <div className="relative z-10 flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
              <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-mono-label uppercase tracking-widest text-slate-400">
                Live on Stellar testnet
              </span>
            </div>
            <h1 className="font-mono text-[2.5rem] font-medium leading-[1.1] tracking-tight text-slate-100 sm:text-5xl md:leading-tight">
              Pay your team.
              <br />
              <span className="text-slate-400">Keep every salary private.</span>
              <br />
              Prove it on-chain.
            </h1>
            <p className="max-w-xl text-lg text-slate-400">
              Confidential payroll for DAOs and Web3 teams. ShieldPay pairs the auditability of a
              public ledger with the privacy of zero-knowledge proofs: pay contributors in native
              USDC on Stellar, keep each amount sealed to its agreed range, and disclose it
              selectively to an auditor under a viewing key.
            </p>
            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Link
                href="/login"
                className="rounded bg-indigo-300 px-8 py-3 text-center font-body text-body-md font-medium text-indigo-950 transition-colors hover:bg-indigo-200"
              >
                Initiate Payroll
              </Link>
              <a
                href="#verify"
                className="flex items-center justify-center gap-2 rounded border border-slate-800 bg-slate-900 px-8 py-3 font-body text-body-md font-medium text-slate-100 transition-colors hover:bg-slate-800"
              >
                <Terminal size={18} />
                Read the Docs
              </a>
            </div>
            <div className="mt-8 flex items-center gap-4 opacity-60">
              <span className="font-mono text-mono-label uppercase tracking-widest text-slate-400">
                Built on Stellar + Zero-Knowledge
              </span>
            </div>
          </div>

          {/* Hero visual (ledger card) */}
          <div className="relative z-10 flex min-h-[400px] w-full items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 blur-3xl"
            />
            <TransactionSetCard />
          </div>
        </div>
      </section>

      {/* Verify it yourself - keeps the wallet-free public verifier */}
      <section id="verify" className="border-t border-slate-800 bg-slate-900/30 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="font-mono text-mono-label uppercase tracking-widest text-slate-400">
              Public verification
            </p>
            <h2 className="mt-3 font-headline text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
              Do not trust us, check the chain
            </h2>
            <p className="mx-auto mt-4 text-slate-400">
              Every payment leaves a proof recorded inside a Stellar contract. Read one yourself,
              right here, without an account.
            </p>
          </div>
          <VerifyPanel />
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1200px] flex-col items-center justify-between border-t border-slate-800 bg-slate-950 px-8 py-8 md:flex-row">
        <div className="mb-4 flex items-center gap-2 md:mb-0">
          <Shield size={20} className="text-slate-600" />
          <span className="font-mono text-mono-label uppercase tracking-widest text-slate-400">
            ShieldPay
          </span>
        </div>
        <p className="mb-4 text-center font-mono text-mono-data text-emerald-400 md:mb-0 md:text-left">
          © 2026 ShieldPay. Confidential Ledger Technology.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a
            href="https://github.com/deegalabs/shieldpay"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-mono text-mono-data text-slate-400 transition-opacity duration-300 hover:text-slate-100 hover:underline hover:decoration-indigo-400"
          >
            <Github size={14} /> GitHub
          </a>
          <Link
            href="/privacy"
            className="font-mono text-mono-data text-slate-400 transition-opacity duration-300 hover:text-slate-100 hover:underline hover:decoration-indigo-400"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="font-mono text-mono-data text-slate-400 transition-opacity duration-300 hover:text-slate-100 hover:underline hover:decoration-indigo-400"
          >
            Terms
          </Link>
          <a
            href="#verify"
            className="font-mono text-mono-data text-slate-400 transition-opacity duration-300 hover:text-slate-100 hover:underline hover:decoration-indigo-400"
          >
            Proof
          </a>
        </div>
      </footer>
    </div>
  );
}

type LedgerRow = {
  index: string;
  initials: string;
  name: string;
  range: string;
  highlight?: boolean;
};

const LEDGER_ROWS: LedgerRow[] = [
  { index: '01', initials: 'AL', name: 'Ada Lovelace', range: '$12k - $14k' },
  { index: '02', initials: 'AT', name: 'Alan Turing', range: '$450 - $550', highlight: true },
  { index: '03', initials: 'GH', name: 'Grace Hopper', range: '$8k - $10k' },
];

/**
 * The signature "Transaction Set" ledger card. Static illustrative demo rows: a
 * contributor paired with a sealed masked chip (amount sealed to its agreed
 * range), one row selected with an inset indigo left rail, and an emerald
 * on-chain seal in the footer.
 */
function TransactionSetCard() {
  return (
    <div className="top-edge relative w-full max-w-md overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/60 px-6 py-4">
        <div className="flex items-center gap-2">
          <Braces size={14} className="text-slate-500" />
          <span className="font-mono text-mono-label uppercase tracking-widest text-slate-400">
            Transaction Set _0x8F2A
          </span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 size={14} />
          <span className="font-mono text-mono-label uppercase">Verified</span>
        </div>
      </div>

      {/* Ledger rows */}
      <div className="flex flex-col">
        {LEDGER_ROWS.map((r, i) => (
          <div
            key={r.name}
            className={cn(
              'relative flex items-center justify-between px-6 py-4 transition-colors',
              i < LEDGER_ROWS.length - 1 && 'border-b border-slate-800',
              r.highlight ? 'bg-slate-800/60' : 'hover:bg-slate-800/50',
            )}
          >
            {r.highlight && (
              <div aria-hidden className="absolute bottom-0 left-0 top-0 w-1 bg-indigo-400" />
            )}
            <div className="flex items-center gap-4">
              <span className="font-mono text-mono-data text-slate-600">{r.index}</span>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 bg-slate-950">
                  <span className="font-mono text-mono-data text-slate-300">{r.initials}</span>
                </span>
                <span className="font-body text-body-md font-medium text-slate-100">{r.name}</span>
              </div>
            </div>
            {/* Sealed masked chip */}
            <div
              className={cn(
                'flex items-center gap-2 rounded-full border bg-slate-950 px-3 py-1',
                r.highlight ? 'border-indigo-400/30' : 'border-slate-800',
              )}
            >
              <Lock size={14} className={r.highlight ? 'text-indigo-300' : 'text-slate-500'} />
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  r.highlight ? 'bg-emerald-400' : 'bg-indigo-400',
                )}
              />
              <span
                className={cn(
                  'font-mono text-mono-data',
                  r.highlight ? 'text-slate-100' : 'text-slate-400',
                )}
              >
                {r.range}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/10 bg-slate-950 px-6 py-3">
        <span className="font-mono text-mono-label text-slate-600">Total Encrypted Payload</span>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400 bg-emerald-400/20">
            <BadgeCheck size={12} className="text-emerald-400" />
          </span>
          <span className="font-mono text-mono-label text-emerald-400">ZKP GENERATED</span>
        </div>
      </div>
    </div>
  );
}
