import Link from 'next/link';
import {
  Globe,
  KeyRound,
  ArrowRight,
  Check,
  FileCheck,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandMark } from '@/components/ui/brand-mark';

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
          <nav className="flex items-center gap-2">
            <a href="#how" className="hidden px-3 py-2 text-sm text-muted hover:text-foreground sm:block">
              How it works
            </a>
            <a href="#audit" className="hidden px-3 py-2 text-sm text-muted hover:text-foreground sm:block">
              Confidential
            </a>
            <Link href="/help" className="hidden px-3 py-2 text-sm text-muted hover:text-foreground sm:block">
              Help
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
        <Badge variant="brand" className="mb-6">
          <Lock size={12} /> Built on Stellar + Zero-Knowledge
        </Badge>
        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
          Pay your team.{' '}
          <span className="bg-gradient-to-r from-brand to-primary bg-clip-text text-transparent">
            Keep the amounts private.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted">
          Confidential payroll for DAOs and Web3 teams. ShieldPay pays contributors in native USDC
          on Stellar with a real on-chain settlement, while a zero-knowledge proof keeps each
          amount private, and lets you disclose it selectively to an auditor under a viewing key.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Get started <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="#how">See how it works</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted">No seed phrases. Sign in with email, Google, or a passkey.</p>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-6">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/12 text-brand">
              {f.icon}
            </span>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </Card>
        ))}
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-surface/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            Three steps from payroll to a private, independently verifiable receipt.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 font-semibold text-brand">
                  {i + 1}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confidential / selective disclosure */}
      <section id="audit" className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge variant="success" className="mb-4">
              <KeyRound size={12} /> Selective disclosure
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">Auditable without going public</h2>
            <p className="mt-4 text-muted">
              On a transparent chain, a normal transfer reveals the amount. ShieldPay keeps each
              amount as a commitment plus a range proof, and lets you reveal it only to an
              authorized auditor under a viewing key, who re-derives the same commitment the
              Stellar contract verified, so the disclosed figure is provably the one on-chain.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {DISCLOSURE.map((l) => (
                <li key={l} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 text-primary" /> {l}
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted">
              <FileCheck size={16} /> Payment Proof, May/2026
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row k="Payer" v="Acme DAO" />
              <Row k="Recipient" v="Jane · GARR…PUKK" />
              <Row k="Proven range" v="$450 to $550 USDC" />
              <Row k="Exact amount" v="Private 🔒" />
              <Row k="Status" v="Verified on-chain" verified />
            </div>
            <div className="mt-5 rounded-lg border border-border bg-background/50 p-3 text-xs text-muted">
              Mathematically verified by the Stellar network. The exact amount stays private,
              revealed only to an auditor you authorize with a viewing key.
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <Card className="p-10">
          <h2 className="text-3xl font-bold tracking-tight">Pay privately, prove publicly</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Set up your team in minutes. No crypto wallet or seed phrase required.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/login">
              Create your account <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        Built on Stellar + Zero-Knowledge · Stellar Hacks: ZK 2026
      </footer>
    </div>
  );
}

function Row({ k, v, verified }: { k: string; v: string; verified?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted">{k}</span>
      <span className={verified ? 'font-medium text-primary' : 'font-medium'}>{v}</span>
    </div>
  );
}

const FEATURES = [
  { icon: <Globe size={20} />, title: 'Global USDC payouts', body: 'Pay contributors anywhere in native USDC on Stellar. Settles in 3-5 seconds, fractions of a cent in fees.' },
  { icon: <Lock size={20} />, title: 'Private by default', body: 'Every payment carries a zero-knowledge proof | the public sees only the agreed range, never the exact amount.' },
  { icon: <KeyRound size={20} />, title: 'Selective disclosure', body: 'Hand an auditor a viewing key to reveal and re-verify exact amounts against the on-chain commitments | without ever making them public.' },
];

const STEPS = [
  { title: 'Run payroll', body: 'Pay your whole team in one confidential run, each within their agreed range.' },
  { title: 'Prove & settle on-chain', body: 'A zero-knowledge proof is verified inside a Stellar smart contract, and a real, recipient-visible settlement is posted | without the amount.' },
  { title: 'Disclose on your terms', body: 'Share a read-only audit link, or a viewing-key link that reveals and re-verifies amounts for an authorized auditor.' },
];

const DISCLOSURE = [
  'Exact amounts never public, only the agreed range is on-chain',
  'Real, recipient-visible settlement, bound to the proof',
  'Viewing key reveals & re-verifies amounts for an auditor',
  'Reconciled run total, provable to a third party',
];
