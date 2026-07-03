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
import { usdRange } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConnectionError } from '@/components/ui/connection-error';
import { DataTable, type Column } from '@/components/ui/data-table';
import { MaskedAmount } from '@/components/ui/masked-amount';
import { ContractorForm } from '@/components/contractor-form';
import { ContractorActions } from '@/components/contractor-actions';
import { ProofOfIncomeCard } from '@/components/proof-of-income-card';

export const dynamic = 'force-dynamic';

const OVERLINE = 'text-xs font-[550] uppercase tracking-[0.06em] text-fg-subtle';

export default async function ContractorDetail({ params }: { params: { id: string } }) {
  const session = await getSession();
  const company = session ? await getCompanyByOwner(session.sub) : null;
  const contractor = company ? await getContractor(params.id, company.id) : null;

  if (!contractor) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="font-medium text-fg-strong">Contributor not found</p>
        <Link href="/contractors" className="mt-2 inline-block text-brand-text hover:underline">
          Back to contributors
        </Link>
      </div>
    );
  }

  let payments: PaymentRow[] = [];
  let paymentsError = false;
  try {
    if (contractor.stellar_address) {
      payments = await listPaymentsForWorker(contractor.stellar_address);
    }
  } catch {
    paymentsError = true;
  }

  const range = { minCents: contractor.range_min, maxCents: contractor.range_max };

  const paymentColumns: Array<Column<PaymentRow>> = [
    {
      key: 'reference',
      header: 'Reference',
      cell: (p) => <span className="font-medium text-fg-strong">{p.reference}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (p) => (
        <MaskedAmount
          state="verified"
          range={{ minCents: p.range_min, maxCents: p.range_max }}
          proofId={p.proof_id}
        />
      ),
    },
    {
      key: 'links',
      header: '',
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-3 text-sm">
          <a
            className="inline-flex items-center gap-1 text-brand-text hover:underline"
            href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
            target="_blank"
            rel="noreferrer"
          >
            Proof <ArrowUpRight size={13} />
          </a>
          <a
            className="text-fg-strong hover:underline"
            href={`/api/receipt?id=${p.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Receipt
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href="/contractors"
        className="inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg-default"
      >
        <ArrowLeft size={14} /> Back to contributors
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-fg-default">{contractor.name}</h1>
          {contractor.stellar_address && (
            <p className="break-all font-mono text-xs text-fg-faint">
              {contractor.stellar_address}
            </p>
          )}
        </div>
        {contractor.anchored ? (
          <Badge variant="success">
            <ShieldCheck size={12} /> Identity anchored
          </Badge>
        ) : (
          <Badge variant="warning">
            <AlertCircle size={12} /> Not anchored
          </Badge>
        )}
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="space-y-2">
          <p className={OVERLINE}>Agreed range</p>
          <MaskedAmount state="masked" range={range} />
        </div>
        <ContractorActions id={contractor.id} anchored={contractor.anchored} />
      </Card>

      {contractor.stellar_address && (
        <section className="space-y-3">
          <h2 className={OVERLINE}>Proof of income</h2>
          <ProofOfIncomeCard
            workerAddress={contractor.stellar_address}
            workerName={contractor.name}
            defaultMinCents={contractor.range_min}
            defaultMaxCents={contractor.range_max}
          />
        </section>
      )}

      <section className="space-y-3">
        <h2 className={OVERLINE}>Payment history</h2>
        {paymentsError ? (
          <ConnectionError
            title="We cannot reach this contributor's payments right now."
            message="Please try again in a moment."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <DataTable
              columns={paymentColumns}
              rows={payments}
              rowKey={(p) => p.id}
              caption="Verified payments to this contributor."
              empty="No payments to this contributor yet."
            />
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className={OVERLINE}>Edit details</h2>
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
