import Link from 'next/link';
import {
  Globe,
  KeyRound,
  ArrowRight,
  Check,
  FileCheck,
  Lock,
  Github,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandMark } from '@/components/ui/brand-mark';
import { VerifyPanel } from '@/components/verify-panel';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
              <BrandMark size={18} />
            </span>
            <span className="font-semibold tracking-tight">ShieldPay</span>
          </Link>
          <nav className="flex items-center gap-1">
            <a href="#how" className="hidden px-3 py-2 text-sm text-fg-subtle transition-colors hover:text-foreground sm:block">
              How it works
            </a>
            <a href="#audit" className="hidden px-3 py-2 text-sm text-fg-subtle transition-colors hover:text-foreground sm:block">
              Confidential
            </a>
            <Link
              href="/verify-income"
              className="hidden px-3 py-2 text-sm text-fg-subtle transition-colors hover:text-foreground sm:block"
            >
              Verify income
            </Link>
            <Link href="/help" className="hidden px-3 py-2 text-sm text-fg-subtle transition-colors hover:text-foreground sm:block">
              Help
            </Link>
            <Button asChild variant="ghost" size="sm" className="ml-1">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <AmbientLight />
        <div className="mx-auto max-w-4xl px-6 pb-24 pt-24 text-center animate-fade-in sm:pt-32">
          <Badge variant="brand" className="mb-7">
            <Lock size={12} /> Built on Stellar + Zero-Knowledge
          </Badge>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[4rem]">
            Pay your team. Keep the amounts private.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-relaxed text-fg-subtle">
            Confidential payroll for DAOs and Web3 teams. ShieldPay pays contributors in native USDC
            on Stellar with a real on-chain settlement, while a zero-knowledge proof keeps each
            amount private, and lets you disclose it selectively to an auditor under a viewing key.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Get started <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <p className="mt-5 text-xs text-fg-faint">No seed phrases. Sign in with email, Google, or a passkey.</p>
        </div>
        <GradientRule className="mx-auto max-w-2xl" />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="overline">Why ShieldPay</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Confidential payroll, end to end
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-fg-subtle">
            Real settlement on a public chain, exact amounts kept private, and disclosure only to the
            people you choose.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="p-6 transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.1)] hover:border-border-strong hover:bg-surface-2"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand-text ring-1 ring-brand/20">
                {f.icon}
              </span>
              <h3 className="mt-5 text-base font-semibold text-fg-default">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-subtle">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-surface/30 py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="overline">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Payroll to a private, verifiable receipt
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-fg-subtle">
              Three steps, no exact amount ever made public.
            </p>
          </div>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="mb-5 grid h-10 w-10 place-items-center rounded-full bg-brand/10 font-mono text-sm font-semibold text-brand-text ring-1 ring-brand/25">
                  {i + 1}
                </div>
                <h3 className="text-base font-semibold text-fg-default">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-subtle">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confidential / selective disclosure */}
      <section id="audit" className="mx-auto max-w-5xl px-6 py-28">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <Badge variant="success" className="mb-5">
              <KeyRound size={12} /> Selective disclosure
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Auditable without going public
            </h2>
            <p className="mt-5 leading-relaxed text-fg-subtle">
              On a transparent chain, a normal transfer reveals the amount. ShieldPay keeps each
              amount as a commitment plus a range proof, and lets you reveal it only to an
              authorized auditor under a viewing key, who re-derives the same commitment the
              Stellar contract verified, so the disclosed figure is provably the one on-chain.
            </p>
            <ul className="mt-7 space-y-3 text-sm">
              {DISCLOSURE.map((l) => (
                <li key={l} className="flex items-start gap-2.5 text-fg-strong">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand-text" /> {l}
                </li>
              ))}
            </ul>
          </div>
          <ProofCard
            heading="Payment Proof, May/2026"
            rows={[
              { k: 'Payer', v: 'Acme DAO' },
              { k: 'Recipient', v: 'Jane · GARR…PUKK', mono: true },
              { k: 'Proven range', v: '$450 to $550 USDC', mono: true },
              { k: 'Exact amount', v: <MaskedAmount /> },
              { k: 'Status', v: <VerifiedBadge /> },
            ]}
            note="Mathematically verified by the Stellar network. The exact amount stays private, revealed only to an auditor you authorize with a viewing key."
          />
        </div>
      </section>

      {/* Proof of income */}
      <section id="income" className="mx-auto max-w-5xl px-6 pb-28">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <Badge variant="brand" className="mb-5">
              <FileCheck size={12} /> Proof of income
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Prove your income without revealing it
            </h2>
            <p className="mt-5 leading-relaxed text-fg-subtle">
              When a worker needs to show income to a bank, a landlord, or a consulate, ShieldPay
              lets their employer attest it on-chain. The proof confirms the income falls within an
              agreed range over recent payments, and anyone can check it against the Stellar network,
              without seeing a single exact amount.
            </p>
            <ul className="mt-7 space-y-3 text-sm">
              {INCOME_POINTS.map((l) => (
                <li key={l} className="flex items-start gap-2.5 text-fg-strong">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand-text" /> {l}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/verify-income">
                  Verify a proof of income <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
          <ProofCard
            heading="Proof of income, Jane · GARR…PUKK"
            rows={[
              { k: 'Issued by', v: 'Acme DAO' },
              { k: 'Covers', v: 'Last 6 payments' },
              { k: 'Proven range', v: '$2,700 to $3,300 USDC', mono: true },
              { k: 'Exact amounts', v: <MaskedAmount /> },
              { k: 'Status', v: <VerifiedBadge /> },
            ]}
            note="Attested by the employer and checked against the Stellar network. Share the verification link with a bank, landlord, or consulate, who confirms it without seeing any monthly amount."
          />
        </div>
      </section>

      {/* Verify on-chain, no wallet */}
      <section id="verify" className="border-t border-border bg-surface/30 py-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="overline">Public verification</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Do not trust us, check the chain
            </h2>
            <p className="mx-auto mt-4 text-fg-subtle">
              Every payment leaves a proof recorded inside a Stellar contract. Read one yourself,
              right here, without an account.
            </p>
          </div>
          <VerifyPanel />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-28">
        <Card className="relative overflow-hidden p-12 text-center">
          <div className="absolute inset-x-0 top-0">
            <GradientRule />
          </div>
          <AmbientLight className="opacity-70" />
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pay privately, prove publicly</h2>
          <p className="mx-auto mt-4 max-w-lg text-fg-subtle">
            Set up your team in minutes. No crypto wallet or seed phrase required.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/login">
              Create your account <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
                  <BrandMark size={18} />
                </span>
                <span className="font-semibold tracking-tight">ShieldPay</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm text-fg-subtle">
                Private payroll you can prove. Confidential payroll for DAOs and Web3 teams,
                settled on Stellar and verified with zero-knowledge proofs.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <SocialLink href="https://github.com/deegalabs/shieldpay" label="GitHub">
                  <Github size={16} />
                </SocialLink>
              </div>
            </div>

            <div className="lg:col-span-2 lg:col-start-7">
              <FooterCol
                title="Product"
                links={[
                  { label: 'How it works', href: '#how' },
                  { label: 'Confidential', href: '#audit' },
                  { label: 'Proof of income', href: '#income' },
                  { label: 'Verify a payment', href: '#verify' },
                  { label: 'Verify income', href: '/verify-income' },
                  { label: 'Get started', href: '/login' },
                ]}
              />
            </div>
            <div className="lg:col-span-3">
              <FooterCol
                title="Resources"
                links={[
                  { label: 'Help & docs', href: '/help' },
                  { label: 'GitHub', href: 'https://github.com/deegalabs/shieldpay', external: true },
                  { label: 'Stellar', href: 'https://stellar.org', external: true },
                  { label: 'Stellar Hacks: ZK', href: 'https://dorahacks.io/hackathon/stellar-hacks-zk/detail', external: true },
                ]}
              />
            </div>
            <div className="lg:col-span-2">
              <FooterCol
                title="Legal"
                links={[
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Privacy Policy', href: '/privacy' },
                ]}
              />
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-fg-subtle sm:flex-row">
            <p>© 2026 ShieldPay. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <Lock size={13} /> Built on Stellar + Zero-Knowledge · Stellar Hacks: ZK 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * The one ornament: the indigo-to-emerald gradient behaving as faint light, not
 * paint. A soft radial wash sits behind the hero and the CTA; it must read as
 * atmosphere, never as a colored blob (keep the alpha low).
 */
function AmbientLight({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden',
        className,
      )}
    >
      <div
        className="h-[34rem] w-[64rem] max-w-none -translate-y-40 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.06) 55%, transparent 80%)',
        }}
      />
    </div>
  );
}

/** Gradient-as-light on a hairline: a calm accent rule, indigo fading to emerald. */
function GradientRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('h-px w-full', className)}
      style={{
        background:
          'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.45), rgba(16, 185, 129, 0.35), transparent)',
      }}
    />
  );
}

/**
 * Marketing preview of the masked amount state: a slate chip on surface-3 with the
 * indigo "protected" dot. Previews the app's signature amount-disclosure component.
 */
function MaskedAmount() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2 py-0.5 font-mono text-xs tabular-nums text-fg-subtle"
      title="Hidden by a zero-knowledge proof"
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
      Hidden
    </span>
  );
}

/** Marketing preview of the verified state: the emerald wash + line + earned glow. */
function VerifiedBadge() {
  return (
    <span className="badge-verified !text-xs">
      <ShieldCheck size={12} /> Verified on-chain
    </span>
  );
}

type ProofRow = { k: string; v: React.ReactNode; mono?: boolean };

/** Landing proof card with a subtle emerald-to-indigo glow on its top edge. */
function ProofCard({ heading, rows, note }: { heading: string; rows: ProofRow[]; note: string }) {
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0">
        <GradientRule />
      </div>
      <div className="flex items-center gap-2 text-sm text-fg-subtle">
        <FileCheck size={16} /> {heading}
      </div>
      <div className="mt-5 space-y-1">
        {rows.map((r) => (
          <Row key={r.k} k={r.k} v={r.v} mono={r.mono} />
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-border bg-surface-base/50 p-3 text-xs leading-relaxed text-fg-faint">
        {note}
      </div>
    </Card>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface-2 text-fg-subtle transition duration-150 hover:border-border-strong hover:text-foreground"
    >
      {children}
    </a>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string; external?: boolean }[] }) {
  return (
    <div>
      <h3 className="overline">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-fg-subtle transition hover:text-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="text-sm text-fg-subtle transition hover:text-foreground">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ k, v, mono }: ProofRow) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-sm text-fg-subtle">{k}</span>
      <span className={cn('text-sm font-medium text-fg-default', mono && 'figure')}>{v}</span>
    </div>
  );
}

const FEATURES = [
  { icon: <Globe size={20} />, title: 'Global USDC payouts', body: 'Pay contributors anywhere in native USDC on Stellar. Settles in 3-5 seconds, fractions of a cent in fees.' },
  { icon: <Lock size={20} />, title: 'Private by default', body: 'Every payment carries a zero-knowledge proof. The public sees only the agreed range, never the exact amount.' },
  { icon: <KeyRound size={20} />, title: 'Selective disclosure', body: 'Hand an auditor a viewing key to reveal and re-verify exact amounts against the on-chain commitments, without ever making them public.' },
];

const STEPS = [
  { title: 'Run payroll', body: 'Pay your whole team in one confidential run, each within their agreed range.' },
  { title: 'Prove & settle on-chain', body: 'A zero-knowledge proof is verified inside a Stellar smart contract, and a real, recipient-visible settlement is posted, without the amount.' },
  { title: 'Disclose on your terms', body: 'Share a read-only audit link, or a viewing-key link that reveals and re-verifies amounts for an authorized auditor.' },
];

const INCOME_POINTS = [
  'Attested by the employer, verifiable by anyone',
  'Shows an agreed range, never an exact monthly amount',
  'No account or wallet needed to verify',
  'Also available as a printable statement for a bank or consulate',
];

const DISCLOSURE = [
  'Exact amounts never public, only the agreed range is on-chain',
  'Real, recipient-visible settlement, bound to the proof',
  'Viewing key reveals & re-verifies amounts for an auditor',
  'Reconciled run total, provable to a third party',
];
