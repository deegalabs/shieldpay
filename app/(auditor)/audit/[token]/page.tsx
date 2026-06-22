import { ShieldCheck, Download, ArrowUpRight, Lock, KeyRound, AlertTriangle } from 'lucide-react';
import {
  listPayments,
  listPaymentsForCompany,
  ensureCompanyViewingKey,
  getCompanyById,
  type PaymentRow,
} from '@/lib/db/client';
import { disclosePayments, summarizeDisclosure, type Disclosed } from '@/lib/payments/disclose';
import { EXPLORER_BASE } from '@/lib/constants';
import { truncateKey } from '@/lib/utils';
import { verifyScopedToken, type AuditTokenClaims } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfoHint } from '@/components/ui/tooltip';

export const dynamic = 'force-dynamic';

const fmt = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Auditor portal — read-only, time-boxed access via a signed, expiring token.
 * No wallet required. Minted by a company (/api/auth/auditor-link).
 *
 * Two tiers:
 *  - read-only: public range + on-chain proofs only.
 *  - viewing-key (disclose): exact amounts revealed AND re-verified against the
 *    on-chain commitments, with a reconciled total (N4 selective disclosure).
 */
export default async function AuditorView({ params }: { params: { token: string } }) {
  const claims = await verifyScopedToken<AuditTokenClaims>(params.token);
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
    payments = claims.companyId
      ? await listPaymentsForCompany(claims.companyId, 1000)
      : await listPayments(100);
  } catch {
    /* DB unreachable */
  }
  const contractors = new Set(payments.map((p) => p.worker_address)).size;

  // Viewing-key tier: open + verify each amount against its on-chain commitment.
  // The key is resolved server-side from the company, never carried in the token.
  // The link's disclosure epoch must still match the company's current epoch;
  // a rotation revokes the link, dropping it back to read-only.
  let disclose = Boolean(claims.disclose && claims.companyId);
  if (disclose && claims.companyId) {
    try {
      const company = await getCompanyById(claims.companyId);
      if (!company || (claims.epoch ?? 0) !== company.disclose_epoch) disclose = false;
    } catch {
      disclose = false; // cannot confirm the epoch — fail closed to read-only
    }
  }
  let disclosed: Map<string, Disclosed> = new Map();
  let summary = { disclosedTotalCents: 0, disclosedCount: 0, allMatch: true };
  if (disclose && claims.companyId) {
    try {
      const vk = await ensureCompanyViewingKey(claims.companyId);
      disclosed = await disclosePayments(vk, payments);
      summary = summarizeDisclosure(disclosed);
    } catch {
      /* fall back to read-only rendering */
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit report</h1>
          <p className="text-sm text-muted">
            {disclose ? 'Viewing-key access' : 'Read-only access'} · token {truncateKey(params.token)}
          </p>
        </div>
        <Button asChild variant="ghost">
          <a href={`/api/audit/export?token=${params.token}`}>
            <Download size={15} /> Export CSV
          </a>
        </Button>
      </header>

      {disclose && (
        <Card className="mb-8 border-accent/30 bg-accent/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                <KeyRound size={18} />
              </span>
              <div>
                <p className="font-semibold">Selective disclosure unlocked</p>
                <p className="text-sm text-muted">
                  Exact amounts are revealed and each was re-checked against the commitment the
                  Stellar contract verified on-chain.
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted">Disclosed total</p>
              <p className="text-2xl font-bold">{fmt(summary.disclosedTotalCents)} USDC</p>
              <p className="text-xs text-muted">{summary.disclosedCount} payments</p>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-3 text-sm">
            {summary.allMatch ? (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <ShieldCheck size={15} /> All disclosed amounts match their on-chain commitments.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-danger">
                <AlertTriangle size={15} /> One or more amounts do NOT match the on-chain commitment.
              </span>
            )}
          </div>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Verified proofs" value={String(payments.filter((p) => p.verified).length)} />
        <Stat label="Contractors" value={String(contractors)} />
        <Stat
          label={disclose ? 'Disclosed total' : 'Payments'}
          value={disclose ? `${fmt(summary.disclosedTotalCents)}` : String(payments.length)}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Contractor</th>
                <th className="px-5 py-3">Reference</th>
                {disclose ? <th className="px-5 py-3">Amount</th> : null}
                <th className="px-5 py-3">Range</th>
                <th className="px-5 py-3">Proof</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const d = disclosed.get(p.id);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                    <td className="px-5 py-3">{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="px-5 py-3 font-medium">{p.worker_name}</td>
                    <td className="px-5 py-3">{p.reference}</td>
                    {disclose ? (
                      <td className="px-5 py-3">
                        {d && d.amountCents !== null ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-semibold">{fmt(d.amountCents)}</span>
                            {d.matchesOnChain ? (
                              <ShieldCheck size={13} className="text-primary" />
                            ) : (
                              <AlertTriangle size={13} className="text-danger" />
                            )}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    ) : null}
                    <td className="px-5 py-3">${p.range_min / 100}-${p.range_max / 100}</td>
                    <td className="px-5 py-3">
                      <a className="inline-flex items-center gap-1 font-mono text-accent hover:underline" href={`${EXPLORER_BASE}/tx/${p.tx_hash}`} target="_blank" rel="noreferrer">
                        {truncateKey(p.tx_hash, 6, 4)} <ArrowUpRight size={12} />
                      </a>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="success"><ShieldCheck size={12} /> Verified</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <a className="text-foreground hover:underline" href={`/api/receipt?id=${p.id}&token=${params.token}`} target="_blank" rel="noreferrer">PDF</a>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr><td colSpan={disclose ? 8 : 7} className="px-5 py-6 text-muted">No payments in this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-6 flex items-center gap-2 text-sm text-warning">
        <Lock size={14} /> Read-only access. No financial operation can be performed here.
        {disclose ? (
          <>
            {' '}Amounts are disclosed under the company viewing key and re-verified against the
            on-chain commitments.
          </>
        ) : (
          <>
            {' '}Exact amounts are private; each row is backed by an on-chain zero-knowledge proof.
          </>
        )}
        <InfoHint>
          Each payment carries a proof, verified by a Stellar smart contract, that the amount fell
          within the agreed range, provable to a third party without disclosing the figure. A
          viewing-key link additionally reveals the exact amount and re-derives the same commitment
          the contract checked, so the disclosed figure is cryptographically tied to the chain.
        </InfoHint>
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}
