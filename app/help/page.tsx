import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  User,
  Search,
  FileCheck,
  BookOpen,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Help Center — ShieldPay',
  description: 'How ShieldPay works, step-by-step guides, glossary, and FAQ.',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand">
              <ShieldCheck size={18} />
            </span>
            <span className="font-semibold tracking-tight">ShieldPay</span>
          </Link>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <Badge variant="brand" className="mb-4">
          <BookOpen size={12} /> Help Center
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">Everything you need to know</h1>
        <p className="mt-3 text-lg text-muted">
          ShieldPay pays contractors and proves it — with a court-grade receipt anyone can verify.
          No crypto knowledge required.
        </p>

        {/* Jump links */}
        <div className="mt-8 flex flex-wrap gap-2">
          {JUMP.map((j) => (
            <a key={j.href} href={j.href} className="rounded-full border border-border bg-surface/50 px-3 py-1.5 text-sm text-muted hover:text-foreground">
              {j.label}
            </a>
          ))}
        </div>

        {/* How it works */}
        <Section id="how" icon={<ShieldCheck size={18} />} title="How ShieldPay works">
          <p>
            When you pay a contractor, ShieldPay does four things automatically. Together they form
            a chain of evidence that holds up to an audit or a court.
          </p>
          <ol className="mt-4 space-y-3">
            {CHAIN.map((c, i) => (
              <li key={c.title} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-sm font-semibold text-brand">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{c.title}</p>
                  <p className="text-sm text-muted">{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-lg border border-border bg-surface-2/40 p-3 text-sm">
            <strong className="text-foreground">The key idea:</strong> the proof confirms the
            payment was within the agreed contractual range — <em>without revealing the exact
            amount</em>. The salary stays private; the fact that you paid correctly is public and
            verifiable.
          </p>
        </Section>

        {/* Guides */}
        <Section id="guides" icon={<BookOpen size={18} />} title="Step-by-step guides">
          <div className="grid gap-4">
            {GUIDES.map((g) => (
              <Card key={g.title} className="p-5">
                <div className="flex items-center gap-2 font-medium">
                  {g.icon}
                  {g.title}
                </div>
                <ol className="mt-3 space-y-1.5 text-sm text-muted">
                  {g.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-brand">{i + 1}.</span> {s}
                    </li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>
        </Section>

        {/* Receipt */}
        <Section id="receipt" icon={<FileCheck size={18} />} title="Understanding your receipt">
          <p>
            Each payment generates a one-page PDF — the “Payment Proof”. It is written in plain
            language a non-technical reader (a judge, an accountant) can understand, and it contains:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>• Who paid and who was paid (company and contractor).</li>
            <li>• The proven contractual range (not the exact amount).</li>
            <li>• The on-chain proof id and the Stellar transaction that verified it.</li>
            <li>• A QR code that opens the public blockchain explorer to re-verify it instantly.</li>
          </ul>
          <p className="mt-3 text-sm">
            Anyone can scan the QR or open the explorer link to confirm the proof independently —
            they don’t have to trust ShieldPay or the company.
          </p>
        </Section>

        {/* Glossary */}
        <Section id="glossary" icon={<Search size={18} />} title="Glossary (in plain terms)">
          <dl className="space-y-3">
            {GLOSSARY.map((g) => (
              <div key={g.term}>
                <dt className="font-medium text-foreground">{g.term}</dt>
                <dd className="text-sm text-muted">{g.def}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* FAQ */}
        <Section id="faq" icon={<HelpCircle size={18} />} title="Frequently asked questions">
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <p className="font-medium text-foreground">{f.q}</p>
                <p className="text-sm text-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </Section>

        <Card className="mt-12 p-8 text-center">
          <h2 className="text-2xl font-bold">Ready to try it?</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">Set up your company in minutes — no wallet or seed phrase needed.</p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/login">
              Get started <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        ShieldPay · Built on Stellar + Zero-Knowledge
      </footer>
    </div>
  );
}

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-20">
      <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <span className="text-brand">{icon}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-2 text-foreground/90">{children}</div>
    </section>
  );
}

const JUMP = [
  { href: '#how', label: 'How it works' },
  { href: '#guides', label: 'Guides' },
  { href: '#receipt', label: 'Receipts' },
  { href: '#glossary', label: 'Glossary' },
  { href: '#faq', label: 'FAQ' },
];

const CHAIN = [
  { title: 'Identity anchor', body: 'The contractor’s legal identity is linked to their payment address, so a payment can be tied to a real person.' },
  { title: 'Payment', body: 'USDC is sent to the contractor on the Stellar network, with a structured, timestamped reference.' },
  { title: 'Zero-knowledge proof', body: 'A mathematical proof that the amount was within the agreed range is generated and verified inside a Stellar smart contract.' },
  { title: 'Court-grade receipt', body: 'A plain-language PDF bundles everything, with a QR code anyone can use to re-verify it.' },
];

const GUIDES = [
  {
    icon: <Building2 size={16} className="text-brand" />,
    title: 'For companies (HR / payroll)',
    steps: [
      'Sign in and create your company (name and tax id).',
      'Add a contractor with their address and agreed range.',
      'Open “Pay & Prove”, pick the contractor, confirm.',
      'Download the receipt or share an auditor link.',
    ],
  },
  {
    icon: <User size={16} className="text-brand" />,
    title: 'For contractors',
    steps: [
      'Sign in with email, Google, or a passkey — no seed phrase.',
      'See each payment you received, marked “verified”.',
      'Download the receipt PDF for your tax return.',
    ],
  },
  {
    icon: <Search size={16} className="text-brand" />,
    title: 'For auditors / accountants',
    steps: [
      'Open the read-only link the company shared with you.',
      'Review the period’s payments and verified proofs.',
      'Export a CSV, or open any proof on the explorer.',
    ],
  },
];

const GLOSSARY = [
  { term: 'USDC', def: 'A digital dollar (stablecoin). 1 USDC ≈ 1 US dollar. It’s what gets paid to the contractor.' },
  { term: 'Stellar', def: 'A fast, low-cost public payment network. Transfers settle in seconds for fractions of a cent.' },
  { term: 'On-chain', def: 'Recorded on the public blockchain — permanent, timestamped, and verifiable by anyone.' },
  { term: 'Zero-knowledge proof', def: 'A way to prove a statement is true (e.g. “the amount is within range”) without revealing the underlying data (the exact amount).' },
  { term: 'Range proof', def: 'The specific proof ShieldPay uses: it shows the payment was between the agreed minimum and maximum, keeping the figure private.' },
  { term: 'Identity anchor', def: 'A record linking the contractor’s legal identity (CPF) to their payment address.' },
  { term: 'Smart contract (Soroban)', def: 'A small program on Stellar that checks the proof and records the result — no company can fake it.' },
];

const FAQ = [
  { q: 'Do I need a crypto wallet or seed phrase?', a: 'No. You sign in with email, Google, or a passkey. A secure account is created for you behind the scenes.' },
  { q: 'Is the exact salary public?', a: 'No. Only the agreed range is public. The exact amount never leaves the server and is not stored — that’s the whole point of the zero-knowledge proof.' },
  { q: 'How does an auditor or judge verify a receipt?', a: 'They scan the QR code or open the explorer link in the PDF. The Stellar network confirms the proof independently — no need to trust the company.' },
  { q: 'Is this valid as proof of payment?', a: 'It’s designed to be: it binds identity, payment, and a verifiable proof into one record. For contractors/PJ it works today by contractual agreement. See the legal notes on the landing page.' },
  { q: 'What happens if ShieldPay goes away?', a: 'The proofs and records live on the public Stellar blockchain, independently of ShieldPay. They remain verifiable.' },
];
