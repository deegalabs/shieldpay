import { formatUsdc, truncateKey } from '@/lib/utils';

/**
 * Auditor portal — read-only, time-boxed access via a temporary token.
 * No wallet required. Cannot move funds or see current balance.
 */
export default function AuditorView({ params }: { params: { token: string } }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Audit — TechStartup Ltda</h1>
        <p className="text-sm text-muted">
          Period: Jan/2026 – Mar/2026 · Read-only link {truncateKey(params.token)}
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total paid" value={formatUsdc(24600)} />
        <Stat label="Contractors" value="12" />
        <Stat label="Payments" value="36" />
      </div>

      <div className="card p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="p-3">Date</th>
              <th className="p-3">Contractor</th>
              <th className="p-3">Reference</th>
              <th className="p-3">Tx hash</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.tx} className="border-b border-border last:border-0">
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.ref}</td>
                <td className="p-3 font-mono">{truncateKey(r.tx, 6, 4)}</td>
                <td className="p-3"><span className="badge-verified">Verified</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-4">
        <button className="btn-ghost">Export CSV</button>
        <button className="btn-ghost">Export PDF</button>
      </div>

      <p className="mt-6 text-sm text-warning">
        ⚠️ Read-only access. No financial operation can be performed here.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

const ROWS = [
  { date: '31/01', name: 'João S.', ref: 'Jan/2026', tx: 'abc123def456' },
  { date: '28/02', name: 'João S.', ref: 'Feb/2026', tx: 'def456abc789' },
];
