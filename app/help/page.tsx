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
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/ui/brand-mark';

export const metadata = {
  title: 'Help & docs | ShieldPay',
  description: 'How ShieldPay works, step-by-step guides, glossary, and FAQ.',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Slim public header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
              <BrandMark size={18} />
            </span>
            <span className="font-semibold tracking-tight text-fg-default">ShieldPay</span>
            <span className="overline ml-1 hidden sm:inline">Help</span>
          </Link>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="overline text-brand-text">Help &amp; docs</p>
        <h1 className="mt-2 font-headline text-3xl font-semibold tracking-tight text-fg-default sm:text-4xl">
          Everything you need to know
        </h1>
        <p className="mt-3 text-lg text-fg-subtle">
          ShieldPay pays your team in USDC and keeps the amounts private, provably. Confidential
          payroll for DAOs and Web3 teams. No crypto knowledge required.
        </p>

        {/* Jump links */}
        <div className="mt-8 flex flex-wrap gap-2">
          {JUMP.map((j) => (
            <a
              key={j.href}
              href={j.href}
              className="overline rounded-full border border-border bg-surface-2 px-3 py-1.5 text-fg-subtle transition hover:text-fg-default"
            >
              {j.label}
            </a>
          ))}
        </div>

        {/* How it works */}
        <Section id="how" icon={<ShieldCheck size={16} />} title="How ShieldPay works">
          <p className="text-fg-subtle">
            When you pay a contributor, ShieldPay does four things automatically. Together they form
            a chain of evidence that holds up to any audit, while keeping the amount private.
          </p>
          <ol className="mt-5 space-y-4">
            {CHAIN.map((c, i) => (
              <li key={c.title} className="flex gap-3">
                <span className="figure mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand/15 text-sm font-semibold text-brand-text">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-fg-default">{c.title}</p>
                  <p className="text-sm text-fg-subtle">{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-lg border border-border bg-surface-2 p-4 text-sm text-fg-subtle">
            <strong className="text-fg-default">The key idea:</strong> the proof confirms the
            payment was within the agreed contractual range, <em>without revealing the exact
            amount</em>. The salary stays private; the fact that you paid correctly is public and
            verifiable.
          </p>
        </Section>

        {/* Guides */}
        <Section id="guides" icon={<BookOpen size={16} />} title="Step-by-step guides">
          <div className="grid gap-4">
            {GUIDES.map((g) => (
              <Card key={g.title} className="p-6 shadow-edge">
                <div className="flex items-center gap-2 font-medium text-fg-default">
                  {g.icon}
                  {g.title}
                </div>
                <ol className="mt-3 space-y-1.5 text-sm text-fg-subtle">
                  {g.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="figure text-brand-text">{i + 1}.</span> {s}
                    </li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>
        </Section>

        {/* Receipt */}
        <Section id="receipt" icon={<FileCheck size={16} />} title="Understanding your receipt">
          <p className="text-fg-subtle">
            Each payment generates a one-page PDF, the &ldquo;Payment Proof&rdquo;. It is written in
            plain language a non-technical reader (an auditor, an accountant) can understand, and it
            contains:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-fg-subtle">
            <li>• Who paid and who was paid (company and contractor).</li>
            <li>• The proven contractual range (not the exact amount).</li>
            <li>• The on-chain proof id and the Stellar transaction that verified it.</li>
            <li>• A QR code that opens the public blockchain explorer to re-verify it instantly.</li>
          </ul>
          <p className="mt-3 text-sm text-fg-subtle">
            Anyone can scan the QR or open the explorer link to confirm the proof independently, they
            don&rsquo;t have to trust ShieldPay or the company.
          </p>
        </Section>

        {/* Glossary */}
        <Section id="glossary" icon={<Search size={16} />} title="Glossary (in plain terms)">
          <dl className="grid gap-4 sm:grid-cols-2">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="rounded-lg border border-border bg-surface-2 p-4">
                <dt className="font-medium text-fg-default">{g.term}</dt>
                <dd className="mt-1 text-sm text-fg-subtle">{g.def}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* FAQ */}
        <Section id="faq" icon={<HelpCircle size={16} />} title="Frequently asked questions">
          <div className="space-y-2">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-border bg-surface-2 px-4 open:bg-surface-2"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-medium text-fg-default">
                  {f.q}
                  <ChevronDown
                    size={16}
                    className="shrink-0 text-fg-faint transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="pb-4 text-sm text-fg-subtle">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <Card className="mt-14 p-8 text-center shadow-edge">
          <h2 className="font-headline text-2xl font-semibold tracking-tight text-fg-default">
            Ready to try it?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-fg-subtle">
            Set up your company in minutes, no wallet or seed phrase needed.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/login">
              Get started <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        ShieldPay · Confidential payroll on Stellar
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
    <section id={id} className="mt-14 scroll-mt-20">
      <h2 className="flex items-center gap-2 font-headline text-xl font-semibold tracking-tight text-fg-default">
        <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-brand-text">
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-2">{children}</div>
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
  { title: 'Identity anchor', body: 'The contributor’s identity is linked to their payment address on-chain, so a payment can be tied to a real recipient, useful for compliance and audits.' },
  { title: 'Confidential settlement', body: 'A real, recipient-visible transaction is posted on Stellar with a structured, timestamped memo, without the exact amount in the clear.' },
  { title: 'Zero-knowledge proof', body: 'A mathematical proof that the amount was within the agreed range is generated and verified inside a Stellar smart contract.' },
  { title: 'Verifiable receipt', body: 'A plain-language PDF bundles everything, with a QR code anyone can use to re-verify it, and a viewing key can disclose the exact amount to an authorized auditor.' },
];

const GUIDES = [
  {
    icon: <Building2 size={16} className="text-brand-text" />,
    title: 'For companies & DAOs',
    steps: [
      'Sign in and set up your organization (name and type).',
      'Invite contributors; they accept and a wallet is created for them.',
      'Open “Run payroll”, add your team, confirm, each amount stays private.',
      'Share a read-only or a viewing-key audit link.',
    ],
  },
  {
    icon: <User size={16} className="text-brand-text" />,
    title: 'For contributors',
    steps: [
      'Sign in with email, Google, or a passkey, no seed phrase.',
      'See each payment you received, marked “verified”.',
      'Open the recipient-visible settlement, or download the receipt PDF.',
    ],
  },
  {
    icon: <Search size={16} className="text-brand-text" />,
    title: 'For auditors / accountants',
    steps: [
      'Open the link the company shared with you (read-only, or viewing-key).',
      'Review the period’s payments and verified proofs.',
      'With a viewing-key link, see exact amounts re-verified against the chain.',
    ],
  },
];

const GLOSSARY = [
  { term: 'USDC', def: 'A digital dollar (stablecoin). 1 USDC ≈ 1 US dollar. It’s what gets paid to the contractor.' },
  { term: 'Stellar', def: 'A fast, low-cost public payment network. Transfers settle in seconds for fractions of a cent.' },
  { term: 'On-chain', def: 'Recorded on the public blockchain, permanent, timestamped, and verifiable by anyone.' },
  { term: 'Zero-knowledge proof', def: 'A way to prove a statement is true (e.g. “the amount is within range”) without revealing the underlying data (the exact amount).' },
  { term: 'Range proof', def: 'The specific proof ShieldPay uses: it shows the payment was between the agreed minimum and maximum, keeping the figure private.' },
  { term: 'Identity anchor', def: 'A record linking a contributor’s identity to their payment address on-chain, useful for compliance and audits.' },
  { term: 'Viewing key', def: 'A secret the company holds. It lets an authorized auditor reveal and re-verify exact amounts against the on-chain commitments, without making them public.' },
  { term: 'Smart contract (Soroban)', def: 'A small program on Stellar that checks the proof and records the result, no company can fake it.' },
];

const FAQ = [
  { q: 'Do I need a crypto wallet or seed phrase?', a: 'No. You sign in with email, Google, or a passkey. A secure account is created for you behind the scenes.' },
  { q: 'Is the exact salary public?', a: 'No. Only the agreed range is public. The exact amount never leaves the server and is not stored, that’s the whole point of the zero-knowledge proof.' },
  { q: 'How does an auditor verify a receipt?', a: 'They scan the QR code or open the explorer link in the PDF. The Stellar network confirms the proof independently, no need to trust the company. With a viewing-key link, they can also reveal and re-verify the exact amounts.' },
  { q: 'Can someone reveal the exact amount?', a: 'Only with the company’s viewing key. The company can issue a viewing-key audit link that reveals exact amounts to an authorized auditor and re-derives the same commitment the chain verified, so the figure is provably the real one, without ever being public.' },
  { q: 'What happens if ShieldPay goes away?', a: 'The proofs and settlements live on the public Stellar blockchain, independently of ShieldPay. They remain verifiable.' },
];
