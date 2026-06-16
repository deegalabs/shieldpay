import Link from 'next/link';
import { listPayments, paymentStats, type PaymentRow } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function CompanyDashboard() {
  let payments: PaymentRow[] = [];
  let stats = { total: 0, verified: 0, workers: 0 };
  try {
    [payments, stats] = await Promise.all([listPayments(10), paymentStats()]);
  } catch {
    /* DB not reachable — render empty state */
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-muted">TechStartup Ltda</span>
      </header>

      <div className="grid gap-6 sm:grid-cols-3">
        <Stat label="Verified proofs" value={String(stats.verified)} accent />
        <Stat label="Contractors paid" value={String(stats.workers)} />
        <Stat label="Total payments" value={String(stats.total)} />
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/payroll" className="btn-primary">Run payroll</Link>
        <button className="btn-ghost">Add contractor</button>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Recent payments</h2>
        {payments.length === 0 ? (
          <div className="card text-muted">
            No payments yet. Click <span className="text-foreground">Run payroll</span> to
            pay a contractor and generate an on-chain proof.
          </div>
        ) : (
          <div className="card divide-y divide-border p-0">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <span className="font-medium">{p.worker_name}</span>
                <span className="text-muted">{p.reference}</span>
                <span className="text-sm text-muted">
                  ${p.range_min / 100}–${p.range_max / 100} USDC
                </span>
                <span className="badge-verified">Verified</span>
                <a
                  className="text-sm text-accent hover:underline"
                  href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  proof ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 text-xs text-muted">
        Exact amounts are private. Each payment is backed by a zero-knowledge
        proof, verified on-chain, that the amount is within the agreed range.
      </p>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}
