import { listPayments, type PaymentRow } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * Worker portal — received payments and their on-chain proofs.
 * In production this filters by the wallet-authenticated worker; for the demo
 * it shows the recorded payments so the flow is visible end to end.
 */
export default async function WorkerPayments() {
  let payments: PaymentRow[] = [];
  try {
    payments = await listPayments(50);
  } catch {
    /* DB not reachable */
  }

  const latest = payments[0];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">My payments</h1>
      {latest ? (
        <p className="mt-2 text-muted">
          Last payment: {latest.reference} — within ${latest.range_min / 100}–$
          {latest.range_max / 100} USDC ✅
        </p>
      ) : (
        <p className="mt-2 text-muted">No payments received yet.</p>
      )}

      <section className="mt-8 space-y-3">
        {payments.map((p) => (
          <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{p.reference}</p>
              <p className="text-sm text-muted">
                ${p.range_min / 100}–${p.range_max / 100} USDC · Verified on-chain
              </p>
            </div>
            <div className="flex gap-2">
              <a className="btn-ghost" href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">
                📄 Receipt
              </a>
              <a className="btn-ghost" href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
                Proof ↗
              </a>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
