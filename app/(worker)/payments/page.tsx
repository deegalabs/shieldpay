import { ShieldCheck, ArrowUpRight, Download } from 'lucide-react';
import {
  listPayments,
  listPaymentsForWorker,
  listContractorsByAddress,
  type PaymentRow,
  type InviteView,
} from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';
import { getSession } from '@/lib/auth/server';
import { usdRange } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfoHint } from '@/components/ui/tooltip';
import { CompleteAnchor } from '@/components/complete-anchor';

export const dynamic = 'force-dynamic';

function shortAddr(a: string | null): string {
  return a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || '—';
}

/**
 * Worker portal — the collaborator's own profile plus received payments and
 * their proofs. Scoped to the authenticated worker's address; a company
 * session sees all payments.
 */
export default async function WorkerPayments() {
  const session = await getSession();
  let payments: PaymentRow[] = [];
  let orgs: InviteView[] = [];
  try {
    if (session?.role === 'worker') {
      [payments, orgs] = await Promise.all([
        listPaymentsForWorker(session.sub),
        listContractorsByAddress(session.sub),
      ]);
    } else {
      payments = await listPayments(50);
    }
  } catch {
    /* DB not reachable */
  }

  const latest = payments[0];
  const profile = orgs[0] ?? null;
  const displayName = profile?.name || session?.name || 'My account';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hello, {displayName}</h1>
        <p className="mt-1 text-sm text-muted">
          {latest
            ? `Last received: ${latest.reference}`
            : 'Your received payments will appear here.'}
        </p>
      </div>

      {profile && (
        <p className="-mt-3 text-sm text-muted">
          Your wallet: <span className="font-mono text-foreground">{shortAddr(profile.stellar_address)}</span>
        </p>
      )}

      {orgs.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            {orgs.length > 1 ? 'Your organizations' : 'Your organization'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {orgs.map((o) => (
              <Card key={o.id} className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{o.company_name}</p>
                  {o.anchored ? (
                    <Badge variant="success">
                      <ShieldCheck size={12} /> Anchored
                    </Badge>
                  ) : (
                    <Badge variant="warning">Pending anchor</Badge>
                  )}
                </div>
                {o.role && <Field label="Role" value={o.role} />}
                <Field
                  label="Agreed range"
                  value={`${usdRange(o.range_min, o.range_max)} USDC/mo`}
                />
                {!o.anchored && (
                  <>
                    <p className="text-xs text-muted">
                      Finish anchoring your identity on-chain so this organization can pay you.
                    </p>
                    <CompleteAnchor
                      contractorId={String(o.id)}
                      companyAddress={
                        /^G[A-Z2-7]{55}$/.test(o.company_treasury || '')
                          ? o.company_treasury!
                          : process.env.COMPANY_PUBLIC_KEY || ''
                      }
                      anchorContractId={process.env.ANCHOR_REGISTRY_CONTRACT_ID || ''}
                      cpfHash={o.cpf_hash || ''}
                    />
                  </>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

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
                    {p.payer_name ? `${p.payer_name} · ` : ''}
                    {usdRange(p.range_min, p.range_max)} USDC
                  </p>
                </div>
                <span className="inline-flex items-center gap-1">
                  <Badge variant="success">
                    <ShieldCheck size={12} /> Received &amp; verified
                  </Badge>
                  <InfoHint>
                    A mathematical proof, checked inside a Stellar smart contract, confirms this
                    payment was within your agreed range, without revealing the exact amount.
                  </InfoHint>
                </span>
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <a href={`/api/receipt?id=${p.id}`} target="_blank" rel="noreferrer">
                      📄 Receipt
                    </a>
                  </Button>
                  {p.settlement_tx_hash && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={`${EXPLORER_BASE}/tx/${p.settlement_tx_hash}`} target="_blank" rel="noreferrer">
                        Settlement <ArrowUpRight size={13} />
                      </a>
                    </Button>
                  )}
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

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-medium ${mono ? 'font-mono text-sm' : ''}`}>{value}</p>
    </div>
  );
}
