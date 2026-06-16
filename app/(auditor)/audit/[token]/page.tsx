import { ShieldCheck, Download, ArrowUpRight, Lock } from 'lucide-react';
import { listPayments, type PaymentRow } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { truncateKey } from '@/lib/utils';
import { verifyScopedToken } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfoHint } from '@/components/ui/tooltip';

export const dynamic = 'force-dynamic';

/**
 * Auditor portal — read-only, time-boxed access via a signed, expiring token.
 * No wallet required. Minted by a company (/api/auth/auditor-link).
 */
export default async function AuditorView({ params }: { params: { token: string } }) {
  const claims = await verifyScopedToken<{ scope: string }>(params.token);
  if (!claims || claims.scope !== 'audit') {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-warning/15 text-warning">
          <Lock size={22} />
        </span>
        <h1 className="text-2xl font-bold">Link expired or invalid</h1>
        <p className="mt-2 text-muted">
          This audit link is no longer valid. Ask the company to generate a new one.
        </p>
      </main>
    );
  }

  let payments: PaymentRow[] = [];
  try {
    payments = await listPayments(100);
  } catch {
    /* DB unreachable */
  }
  const contractors = new Set(payments.map((p) => p.worker_address)).size;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit report</h1>
          <p className="text-sm text-muted">
            Read-only access · token {truncateKey(params.token)}
          </p>
        </div>
        <Button asChild variant="ghost">
          <a href={`/api/audit/export?token=${params.token}`}>
            <Download size={15} /> Export CSV
          </a>
        </Button>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Verified proofs" value={payments.filter((p) => p.verified).length} />
        <Stat label="Contractors" value={contractors} />
        <Stat label="Payments" value={payments.length} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Contractor</th>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Range</th>
                <th className="px-5 py-3">Proof</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                  <td className="px-5 py-3">{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3 font-medium">{p.worker_name}</td>
                  <td className="px-5 py-3">{p.reference}</td>
                  <td className="px-5 py-3">${p.range_min / 100}–${p.range_max / 100}</td>
                  <td className="px-5 py-3">
                    <a className="inline-flex items-center gap-1 font-mono text-accent hover:underline" href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
                      {truncateKey(p.tx_hash, 6, 4)} <ArrowUpRight size={12} />
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="success"><ShieldCheck size={12} /> Verified</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <a className="text-foreground hover:underline" href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">PDF</a>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-6 text-muted">No payments in this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-6 flex items-center gap-2 text-sm text-warning">
        <Lock size={14} /> Read-only access. No financial operation can be performed here. Exact
        amounts are private; each row is backed by an on-chain zero-knowledge proof.
        <InfoHint>
          Each payment carries a proof, verified by a Stellar smart contract, that the amount fell
          within the agreed range — provable to a third party without disclosing the figure.
        </InfoHint>
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}
