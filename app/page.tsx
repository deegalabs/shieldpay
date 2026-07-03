import Link from 'next/link';
import {
  Shield,
  Menu,
  ArrowUpRight,
  ArrowDownLeft,
  Rocket,
  Check,
  Github,
} from 'lucide-react';
import { VerifyPanel } from '@/components/verify-panel';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { cn } from '@/lib/utils';

/**
 * Marketing landing, rebuilt to the approved "Privacy by Default" Stitch design
 * (temp/.../shieldpay_landing_mobile). The Stitch Material-3 tokens are rendered
 * here as raw standard Tailwind (slate / indigo / emerald), never the app
 * semantic color tokens. The type tokens already defined in tailwind.config
 * (font-mono = Space Mono, font-headline = Space Grotesk, font-body = Inter, and
 * the text-mono-label / text-mono-data / text-headline-lg sizes) carry the
 * typography verbatim from the reference.
 *
 * Mobile reproduces the reference 1:1 (single column, sticky bottom CTA). Desktop
 * widens it into the same language: hero copy on the left, the Vault Balance card
 * on the right, and the Precision Execution timeline as a section below. The
 * wallet-free public verifier and the real footer links are kept.
 *
 * Server Component. VerifyPanel is the only client island.
 */

type Settlement = {
  name: string;
  detail: string;
  range: string;
  direction: 'out' | 'in';
  dimmed?: boolean;
};

const SETTLEMENTS: Settlement[] = [
  { name: 'Acme Corp', detail: 'Payroll Execution', range: '$40k-$50k', direction: 'out' },
  {
    name: 'Venture Fund I',
    detail: 'Capital Call',
    range: '$2M-$5M',
    direction: 'in',
    dimmed: true,
  },
];

type Step = {
  tag: string;
  title: string;
  body: string;
  state: 'active' | 'pending';
};

const STEPS: Step[] = [
  {
    tag: '01 / INITIATE',
    title: 'Construct Transaction',
    body: 'Define parameters locally. Data is encrypted before leaving your secure enclave.',
    state: 'active',
  },
  {
    tag: '02 / VERIFY',
    title: 'Multi-Sig Consensus',
    body: 'Authorized parties approve via zero-knowledge proofs. No sensitive data exposed.',
    state: 'pending',
  },
  {
    tag: '03 / SETTLE',
    title: 'Immutable Record',
    body: 'Transaction is sealed on-chain. Audit logs generated with strict privacy controls.',
    state: 'pending',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 pb-24 text-slate-100 md:pb-0">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Shield size={22} className="text-indigo-300" />
            <span className="font-headline text-headline-lg-mobile tracking-tight text-slate-100 md:text-headline-lg">
              ShieldPay
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/login"
              className="font-mono text-mono-label text-slate-400 transition-colors hover:text-indigo-300"
            >
              Product
            </Link>
            <a
              href="#how-it-works"
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
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden font-mono text-mono-label uppercase text-slate-400 transition-colors hover:text-indigo-300 md:block"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="hidden rounded bg-indigo-300 px-6 py-2 font-body text-body-md font-medium text-indigo-950 transition-colors hover:bg-indigo-200 md:block"
            >
              Get Started
            </Link>
            {/* Mobile hamburger */}
            <Link
              href="/login"
              aria-label="Open menu"
              className="text-slate-400 transition-colors hover:text-indigo-300 md:hidden"
            >
              <Menu size={24} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(circle at center, rgba(128, 131, 255, 0.15) 0%, rgba(78, 222, 163, 0.05) 50%, transparent 100%)',
            }}
          />
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Hero copy */}
            <div className="relative z-10 flex flex-col gap-4">
              <span className="font-mono text-mono-label uppercase tracking-widest text-indigo-300">
                Institutional Ledger
              </span>
              <h1 className="font-mono text-[40px] font-medium leading-[1.1] tracking-tight text-slate-100 md:text-6xl">
                Privacy by
                <br />
                Default.
              </h1>
              <p className="mt-2 max-w-md text-slate-400 md:text-lg">
                Confidential ledger technology for high-net-worth individuals and institutional
                entities. Execute with precision.
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/login"
                  className="flex h-12 items-center justify-center gap-2 rounded-lg bg-indigo-300 px-8 font-body text-body-md font-medium text-indigo-950 transition-colors hover:bg-indigo-200"
                >
                  <Rocket size={20} />
                  Get Started Securely
                </Link>
                <a
                  href="#how-it-works"
                  className="flex h-12 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 px-8 font-body text-body-md font-medium text-slate-100 transition-colors hover:bg-slate-800"
                >
                  How it works
                </a>
              </div>
              <div className="mt-6 opacity-60">
                <span className="font-mono text-mono-label uppercase tracking-widest text-slate-400">
                  Built on Stellar + Zero-Knowledge
                </span>
              </div>
            </div>

            {/* Hero visual: Vault Balance card */}
            <div className="relative z-10 flex w-full items-center justify-center">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 blur-3xl"
              />
              <VaultCard />
            </div>
          </div>
        </section>

        {/* Precision Execution timeline */}
        <section
          id="how-it-works"
          className="border-t border-slate-800/60 px-4 py-16 md:px-8 md:py-24"
        >
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="font-headline text-headline-lg-mobile font-semibold tracking-tight text-slate-100 md:text-4xl lg:sticky lg:top-24">
                Precision Execution.
              </h2>
            </div>
            <div className="relative space-y-10 pl-6">
              {/* Vertical connector */}
              <div
                aria-hidden
                className="absolute bottom-2 left-[11px] top-2 w-[2px] bg-gradient-to-b from-indigo-300 via-slate-800 to-slate-700"
              />
              {STEPS.map((step) => (
                <TimelineStep key={step.tag} step={step} />
              ))}
            </div>
          </div>
        </section>

        {/* Verify it yourself, the wallet-free public verifier */}
        <section
          id="verify"
          className="border-t border-slate-800/60 bg-slate-900/30 px-4 py-16 md:px-8 md:py-24"
        >
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto mb-10 max-w-xl text-center">
              <p className="font-mono text-mono-label uppercase tracking-widest text-indigo-300">
                Public verification
              </p>
              <h2 className="mt-3 font-headline text-headline-lg-mobile font-semibold tracking-tight text-slate-100 md:text-4xl">
                Verify it yourself
              </h2>
              <p className="mx-auto mt-4 text-slate-400">
                Every payment leaves a proof sealed inside a Stellar contract. Read one yourself,
                right here, without an account.
              </p>
            </div>
            <VerifyPanel />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-slate-600" />
            <span className="font-mono text-mono-label uppercase tracking-widest text-slate-400">
              ShieldPay
            </span>
          </div>
          <p className="text-center font-mono text-mono-data text-emerald-400 md:text-left">
            © 2026 ShieldPay. Confidential Ledger Technology.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="https://github.com/deegalabs/shieldpay"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-mono text-mono-data text-slate-400 transition-colors duration-300 hover:text-slate-100 hover:underline hover:decoration-indigo-400"
            >
              <Github size={14} /> GitHub
            </a>
            <Link
              href="/privacy"
              className="font-mono text-mono-data text-slate-400 transition-colors duration-300 hover:text-slate-100 hover:underline hover:decoration-indigo-400"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-mono text-mono-data text-slate-400 transition-colors duration-300 hover:text-slate-100 hover:underline hover:decoration-indigo-400"
            >
              Terms
            </Link>
            <a
              href="#verify"
              className="font-mono text-mono-data text-slate-400 transition-colors duration-300 hover:text-slate-100 hover:underline hover:decoration-indigo-400"
            >
              Proof
            </a>
          </div>
        </div>
      </footer>

      {/* Sticky bottom CTA (mobile only) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/40 bg-slate-950/90 p-4 backdrop-blur-xl md:hidden">
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-indigo-300 font-body text-body-md font-medium text-indigo-950 transition-colors hover:bg-indigo-200"
        >
          <Rocket size={20} />
          Get Started Securely
        </Link>
      </div>
    </div>
  );
}

/**
 * The Vault Balance hero card: a slate panel with a top-edge highlight carrying a
 * masked balance figure (a static marketing demo value, deliberately blurred),
 * an emerald "SECURED" on-chain seal, and two recent settlements, each a sealed
 * range chip. Amounts are never shown in the clear, only the range they fall in.
 */
function VaultCard() {
  return (
    <div className="top-edge relative w-full max-w-md overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
      <div
        aria-hidden
        className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl"
      />

      {/* Balance + seal */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 font-mono text-mono-label uppercase tracking-widest text-slate-400">
            Vault Balance
          </div>
          <div className="font-headline text-headline-lg-mobile text-slate-100">
            <span className="mr-1 text-slate-400">$</span>
            <span className="select-none opacity-80 blur-[4px]">12,450,000</span>
          </div>
        </div>
        <OnChainSeal state="verified" label="SECURED" />
      </div>

      {/* Recent settlements */}
      <div className="mt-6 space-y-3">
        <div className="font-mono text-mono-label uppercase tracking-widest text-slate-400">
          Recent Settlements
        </div>
        {SETTLEMENTS.map((s) => (
          <SettlementRow key={s.name} settlement={s} />
        ))}
      </div>
    </div>
  );
}

function SettlementRow({ settlement }: { settlement: Settlement }) {
  const Icon = settlement.direction === 'out' ? ArrowUpRight : ArrowDownLeft;
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-3',
        settlement.dimmed && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
          <Icon size={16} className="text-slate-400" />
        </span>
        <div className="flex flex-col">
          <span className="font-mono text-mono-data text-slate-100">{settlement.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {settlement.detail}
          </span>
        </div>
      </div>
      <SealedChip label={settlement.range} size="md" />
    </div>
  );
}

function TimelineStep({ step }: { step: Step }) {
  const active = step.state === 'active';
  return (
    <div className="relative">
      {/* Node dot */}
      <div
        className={cn(
          'absolute -left-[30px] top-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-slate-950',
          active ? 'border-indigo-300' : 'border-slate-700',
        )}
      >
        {active ? (
          <div className="h-2 w-2 rounded-full bg-indigo-300" />
        ) : (
          <Check size={12} className="text-slate-700" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span
          className={cn(
            'font-mono text-mono-label uppercase tracking-widest',
            active ? 'text-indigo-300' : 'text-slate-400',
          )}
        >
          {step.tag}
        </span>
        <h3 className="font-body text-body-md font-medium text-slate-100">{step.title}</h3>
        <p className="text-sm text-slate-400">{step.body}</p>
      </div>
    </div>
  );
}
