import Link from 'next/link';

/**
 * Public landing page.
 * Note: per the design rule, no cryptographic jargon is shown to end users.
 * The word "proof" is used in its plain, legal sense — not "ZK proof".
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
      <span className="badge-verified mb-6">Built on Stellar + Zero-Knowledge</span>

      <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
        Pay anyone. Prove it forever.
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-muted">
        ShieldPay pays contractors and employees in native USDC on Stellar and
        automatically generates an on-chain, court-grade proof of payment — a
        mathematical receipt no one can dispute.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link href="/dashboard" className="btn-primary">
          Company portal
        </Link>
        <Link href="/payments" className="btn-ghost">
          Worker portal
        </Link>
      </div>

      <div className="mt-16 grid w-full gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card text-left">
            <h3 className="font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

const FEATURES = [
  {
    title: 'Global payouts',
    body: 'Pay contractors anywhere in native USDC. Settlement in 3–5 seconds, fractions of a cent in fees.',
  },
  {
    title: 'Mathematical proof',
    body: 'Every payment is backed by a zero-knowledge proof verified on-chain — provable without revealing the exact amount.',
  },
  {
    title: 'Legal shield',
    body: 'One click generates a court-ready PDF binding identity, payment, and proof into an irrefutable record.',
  },
];
