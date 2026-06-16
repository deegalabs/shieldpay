import Link from 'next/link';
import { formatUsdc } from '@/lib/utils';

/** Company portal (CFO / HR) — dashboard. Skeleton wired to mock data. */
export default function CompanyDashboard() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-muted">TechStartup Ltda</span>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-muted">Operating balance</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{formatUsdc(12450)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Paid this month</p>
          <p className="mt-1 text-3xl font-bold text-primary">{formatUsdc(8200)}</p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/payroll" className="btn-primary">Run payroll</Link>
        <button className="btn-ghost">Add contractor</button>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Recent payments</h2>
        <div className="card divide-y divide-border p-0">
          {RECENT.map((p) => (
            <div key={p.name} className="flex items-center justify-between p-4">
              <span>{p.name}</span>
              <span className="text-muted">{p.ref}</span>
              <span>{formatUsdc(p.amount)}</span>
              <span className="badge-verified">Verified</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const RECENT = [
  { name: 'João Silva', ref: 'May/2026', amount: 500 },
  { name: 'Maria Souza', ref: 'May/2026', amount: 750 },
  { name: 'Pedro Santos', ref: 'May/2026', amount: 350 },
];
