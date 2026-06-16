import { ShieldCheck, ArrowUpRight, Download } from 'lucide-react';
import { listPayments, listPaymentsForWorker, type PaymentRow } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { getSession } from '@/lib/auth/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfoHint } from '@/components/ui/tooltip';

export const dynamic = 'force-dynamic';

/**
 * Worker portal — received payments and their proofs.
 * Scoped to the authenticated worker's address; a company session sees all.
 */
export default async function WorkerPayments() {
  const session = await getSession();
  let payments: PaymentRow[] = [];
  try {
    payments =
      session?.role === 'worker'
        ? await listPaymentsForWorker(session.sub)
        : await listPayments(50);
  } catch {
    /* DB not reachable */
  }

  const latest = payments[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My payments</h1>
        <p className="mt-1 text-sm text-muted">
          {latest
            ? `Last received: ${latest.reference}`
            : 'Your received payments will appear here.'}
        </p>
      </div>

      {payments.length === 0 ? (
        <Card className="p-8 text-center text-muted">No payments received yet.</Card>
      ) : (
        <>
          <Card className="divide-y divide-border overflow-hidden">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium">{p.reference}</p>
                  <p className="text-sm text-muted">
                    ${p.range_min / 100}–${p.range_max / 100} USDC
                  </p>
                </div>
                <span className="inline-flex items-center gap-1">
                  <Badge variant="success">
                    <ShieldCheck size={12} /> Received &amp; verified
                  </Badge>
                  <InfoHint>
                    A mathematical proof, checked inside a Stellar smart contract, confirms this
                    payment was within your agreed range — without revealing the exact amount.
                  </InfoHint>
                </span>
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <a href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">
                      📄 Receipt
                    </a>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <a href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
                      Proof <ArrowUpRight size={13} />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          <p className="text-xs text-muted">
            Tip: download each receipt PDF for your tax return. Every receipt can be independently
            re-verified on the public blockchain explorer.
          </p>
        </>
      )}
    </div>
  );
}
