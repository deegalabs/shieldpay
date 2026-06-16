import { formatUsdc } from '@/lib/utils';

/** Worker portal — received payments and downloadable receipts. */
export default function WorkerPayments() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Hi, João Silva</h1>
      <p className="mt-2 text-muted">
        Last payment: {formatUsdc(500)} — May/2026 ✅
      </p>

      <section className="mt-8 space-y-3">
        {PAYMENTS.map((p) => (
          <div key={p.ref} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{p.ref}</p>
              <p className="text-sm text-muted">{formatUsdc(p.amount)} · Received</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost">Receipt</button>
              <button className="btn-ghost">Download</button>
            </div>
          </div>
        ))}
      </section>

      <button className="btn-primary mt-8">Download all for tax filing</button>
    </main>
  );
}

const PAYMENTS = [
  { ref: 'May/2026', amount: 500 },
  { ref: 'Apr/2026', amount: 500 },
];
