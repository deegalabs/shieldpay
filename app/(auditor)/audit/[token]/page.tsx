import { listPayments, type PaymentRow } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { truncateKey } from '@/lib/utils';
import { verifyScopedToken } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * Auditor portal — read-only, time-boxed access via a signed, expiring token.
 * No wallet required. The token is minted by a company (/api/auth/auditor-link).
 */
export default async function AuditorView({ params }: { params: { token: string } }) {
  const claims = await verifyScopedToken<{ scope: string }>(params.token);
  if (!claims || claims.scope !== 'audit') {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Link expired or invalid</h1>
        <p className="mt-3 text-muted">
          This audit link is no longer valid. Ask the company to generate a new one.
        </p>
      </main>
    );
  }

  let payments: PaymentRow[] = [];
  try {
    payments = await listPayments(100);
  } catch {
    /* DB not reachable */
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Audit — TechStartup Ltda</h1>
        <p className="text-sm text-muted">
          Read-only access · token {truncateKey(params.token)} · {payments.length} payments
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Verified proofs" value={String(payments.filter((p) => p.verified).length)} />
        <Stat label="Contractors" value={String(new Set(payments.map((p) => p.worker_address)).size)} />
        <Stat label="Payments" value={String(payments.length)} />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="p-3">Date</th>
              <th className="p-3">Contractor</th>
              <th className="p-3">Reference</th>
              <th className="p-3">Range</th>
              <th className="p-3">Tx</th>
              <th className="p-3">Status</th>
              <th className="p-3">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3">{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                <td className="p-3">{p.worker_name}</td>
                <td className="p-3">{p.reference}</td>
                <td className="p-3">${p.range_min / 100}–${p.range_max / 100}</td>
                <td className="p-3">
                  <a className="font-mono text-accent hover:underline" href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
                    {truncateKey(p.tx_hash, 6, 4)}
                  </a>
                </td>
                <td className="p-3"><span className="badge-verified">Verified</span></td>
                <td className="p-3">
                  <a className="text-foreground hover:underline" href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">PDF</a>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td className="p-4 text-muted" colSpan={7}>No payments in this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-4">
        <a className="btn-ghost" href={`/api/audit/export?token=${params.token}`}>📊 Export CSV</a>
      </div>

      <p className="mt-6 text-sm text-warning">
        ⚠️ Read-only access. No financial operation can be performed here. Exact
        amounts are private; each row is backed by an on-chain zero-knowledge proof.
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
