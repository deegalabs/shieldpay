import Link from 'next/link';
import {
  ShieldCheck,
  Globe,
  Scale,
  ArrowRight,
  Check,
  FileCheck,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand">
              <ShieldCheck size={18} />
            </span>
            <span className="font-semibold tracking-tight">ShieldPay</span>
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#how" className="hidden px-3 py-2 text-sm text-muted hover:text-foreground sm:block">
              How it works
            </a>
            <a href="#legal" className="hidden px-3 py-2 text-sm text-muted hover:text-foreground sm:block">
              Legal shield
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
          Pay anyone.{' '}
          <span className="bg-gradient-to-r from-brand to-primary bg-clip-text text-transparent">
            Prove it forever.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted">
          ShieldPay pays contractors in native USDC on Stellar and automatically generates a
          court-grade, on-chain proof of payment — a mathematical receipt no one can dispute,
          without revealing the exact amount.
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
            Three steps from payroll to an irrefutable, independently verifiable receipt.
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

      {/* Legal */}
      <section id="legal" className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge variant="success" className="mb-4">
              <Scale size={12} /> Court-grade proof
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">The receipt you show a judge</h2>
            <p className="mt-4 text-muted">
              A blockchain transfer alone proves nothing in court. ShieldPay chains a signed
              contract, an on-chain identity anchor, the payment, and a zero-knowledge proof into
              a single plain-language PDF — the evidence a labor court actually accepts.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {LEGAL.map((l) => (
                <li key={l} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 text-primary" /> {l}
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted">
              <FileCheck size={16} /> Payment Proof — May/2026
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row k="Payer" v="TechStartup Ltda" />
              <Row k="Recipient" v="João Silva" />
              <Row k="Proven range" v="$450 – $550 USDC" />
              <Row k="Status" v="Verified on-chain" verified />
            </div>
            <div className="mt-5 rounded-lg border border-border bg-background/50 p-3 text-xs text-muted">
              Mathematically verified by the Stellar network. The exact amount is never disclosed.
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <Card className="p-10">
          <h2 className="text-3xl font-bold tracking-tight">Pay with proof, today</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Set up your company in minutes. No crypto wallet or seed phrase required.
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
  { icon: <Globe size={20} />, title: 'Global payouts', body: 'Pay contractors anywhere in native USDC. Settlement in 3–5 seconds, fractions of a cent in fees.' },
  { icon: <ShieldCheck size={20} />, title: 'Mathematical proof', body: 'Every payment is backed by a zero-knowledge proof verified on-chain — provable without revealing the exact amount.' },
  { icon: <Scale size={20} />, title: 'Legal shield', body: 'One click generates a court-ready PDF binding identity, payment, and proof into an irrefutable record.' },
];

const STEPS = [
  { title: 'Run payroll', body: 'Pick a contractor and pay within their agreed contractual range — by form or CSV.' },
  { title: 'Prove on-chain', body: 'A zero-knowledge proof is generated and verified inside a Stellar smart contract.' },
  { title: 'Get the receipt', body: 'Download a court-grade PDF with a QR code anyone can use to re-verify the proof.' },
];

const LEGAL = [
  'Identity anchored on-chain (address ↔ legal identity)',
  'Payment recorded with a structured, timestamped memo',
  'Zero-knowledge proof of in-range payment, verified by the network',
  'Plain-language PDF + QR for instant third-party verification',
];
