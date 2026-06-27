import Link from 'next/link';
import { ArrowLeft, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import {
  getCompanyByOwner,
  getContractor,
  listPaymentsForWorker,
  type PaymentRow,
} from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { usdRange, truncateKey } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContractorForm } from '@/components/contractor-form';
import { ContractorActions } from '@/components/contractor-actions';

export const dynamic = 'force-dynamic';

export default async function ContractorDetail({ params }: { params: { id: string } }) {
  const session = await getSession();
  const company = session ? await getCompanyByOwner(session.sub) : null;
  const contractor = company ? await getContractor(params.id, company.id) : null;

  if (!contractor) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="font-medium">Contractor not found</p>
        <Link href="/contractors" className="mt-2 inline-block text-accent hover:underline">
          Back to contractors
        </Link>
      </div>
    );
  }

  let payments: PaymentRow[] = [];
  try {
    if (contractor.stellar_address) {
      payments = await listPaymentsForWorker(contractor.stellar_address);
    }
  } catch {
    /* ignore */
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/contractors" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Back to contractors
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{contractor.name}</h1>
          <p className="font-mono text-xs text-muted">{contractor.stellar_address}</p>
        </div>
        {contractor.anchored ? (
          <Badge variant="success"><ShieldCheck size={12} /> Identity anchored</Badge>
        ) : (
          <Badge variant="warning"><AlertCircle size={12} /> Not anchored</Badge>
        )}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="text-muted">Contractual range</p>
            <p className="figure font-medium">{usdRange(contractor.range_min, contractor.range_max)} USDC / month</p>
          </div>
          <ContractorActions id={contractor.id} anchored={contractor.anchored} />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Payment history</h2>
        {payments.length === 0 ? (
          <Card className="p-6 text-sm text-muted">No payments to this contractor yet.</Card>
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <span className="font-medium">{p.reference}</span>
                <span className="figure text-sm text-muted">{usdRange(p.range_min, p.range_max)} USDC</span>
                <Badge variant="success"><ShieldCheck size={12} /> Verified</Badge>
                <div className="flex gap-3 text-sm">
                  <a className="inline-flex items-center gap-1 text-accent hover:underline" href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
                    Proof <ArrowUpRight size={13} />
                  </a>
                  <a className="text-foreground hover:underline" href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">
                    Receipt
                  </a>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Edit details</h2>
        <Card className="p-6">
          <ContractorForm
            contractorId={contractor.id}
            defaults={{
              name: contractor.name,
              stellar_address: contractor.stellar_address ?? '',
              minUsdc: contractor.range_min / 100,
              maxUsdc: contractor.range_max / 100,
            }}
            submitLabel="Save changes"
            redirectTo={`/contractors/${contractor.id}`}
          />
        </Card>
      </section>
    </div>
  );
}
