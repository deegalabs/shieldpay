import { FileText, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, listPaymentsForCompany, type PaymentRow } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function ReceiptsPage() {
  let payments: PaymentRow[] = [];
  try {
    const session = await getSession();
    const company = session ? await getCompanyByOwner(session.sub) : null;
    if (company) payments = await listPaymentsForCompany(company.id, 100);
  } catch {
    /* DB unreachable */
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receipts</h1>
        <p className="text-sm text-muted">
          Verifiable payment proofs. Each PDF binds the payment to an on-chain, re-verifiable proof — the exact amount stays private.
        </p>
      </div>

      {payments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-medium">No receipts yet</p>
          <p className="mt-1 text-sm text-muted">Receipts appear here after you run a payroll.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-muted">
                  <FileText size={16} />
                </span>
                <div>
                  <p className="font-medium">
                    {p.worker_name} · {p.reference}
                  </p>
                  <p className="text-xs text-muted">
                    ${p.range_min / 100}–${p.range_max / 100} USDC ·{' '}
                    {new Date(p.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="success">
                  <ShieldCheck size={12} /> Verified
                </Badge>
                <a
                  className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Proof <ArrowUpRight size={13} />
                </a>
                <a
                  className="text-sm font-medium text-foreground hover:underline"
                  href={`/api/receipt?id=${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  ⚖️ Download PDF
                </a>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
