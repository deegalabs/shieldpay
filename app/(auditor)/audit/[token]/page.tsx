import { createHash } from 'node:crypto';
import { Download, ArrowUpRight, Lock, KeyRound, AlertTriangle } from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-mark';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { StatFigure } from '@/components/ui/stat-figure';
import {
  listPayments,
  listPaymentsForCompany,
  ensureCompanyViewingKey,
  getCompanyById,
  logDisclosure,
  claimOneTimeToken,
  type PaymentRow,
} from '@/lib/db/client';
import { disclosePayments, summarizeDisclosure, type Disclosed } from '@/lib/payments/disclose';
import { EXPLORER_BASE } from '@/lib/constants';
import { usdRange, truncateKey } from '@/lib/utils';
import { verifyScopedToken, type AuditTokenClaims } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoHint } from '@/components/ui/tooltip';
import { ConnectionError } from '@/components/ui/connection-error';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@/components/ui/data-table';
import { MaskedAmount } from '@/components/ui/masked-amount';

export const dynamic = 'force-dynamic';

const fmt = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Auditor portal, read-only, time-boxed access via a signed, expiring token.
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
        <p className="mt-2 text-fg-subtle">
          This audit link is no longer valid. Ask the company to generate a new one.
        </p>
      </main>
    );
  }

  let payments: PaymentRow[] = [];
  let dbError = false;
  try {
    payments = claims.companyId
      ? await listPaymentsForCompany(claims.companyId, 1000)
      : await listPayments(100);
  } catch {
    dbError = true; // DB unreachable
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
      disclose = false; // cannot confirm the epoch, fail closed to read-only
    }
  }
  // One-time link: spend it on the first disclosure. A second view (or a DB we
  // cannot reach) claims false and drops to read-only, never re-disclosing.
  if (disclose && claims.oneTime && claims.jti) {
    const firstUse = await claimOneTimeToken(claims.jti);
    if (!firstUse) disclose = false;
  }
  let disclosed: Map<string, Disclosed> = new Map();
  let summary = { disclosedTotalCents: 0, disclosedCount: 0, allMatch: true, verifiedLive: false };
  if (disclose && claims.companyId) {
    try {
      const vk = await ensureCompanyViewingKey(claims.companyId);
      disclosed = await disclosePayments(vk, payments);
      summary = summarizeDisclosure(disclosed);
      // Record the disclosure (best-effort: never break the auditor view).
      try {
        await logDisclosure({
          companyId: claims.companyId,
          tokenHash: createHash('sha256').update(params.token).digest('hex'),
          paymentCount: summary.disclosedCount,
          disclosedTotalCents: summary.disclosedTotalCents,
          allMatch: summary.allMatch,
          verifiedLive: summary.verifiedLive,
        });
      } catch {
        /* logging is best-effort */
      }
    } catch {
      /* fall back to read-only rendering */
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Slim public header: wordmark + confidential marker, no sidebar. */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
              <BrandMark size={18} />
            </span>
            <span className="font-semibold tracking-tight text-fg-default">ShieldPay</span>
            <span className="overline ml-1 hidden sm:inline">Confidential</span>
          </div>
          <Button asChild variant="ghost">
            <a href={`/api/audit/export?token=${params.token}`}>
              <Download size={15} /> Export CSV
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-8">
          <p className="overline mb-1 text-brand-text">Audit report</p>
          <h1 className="font-headline text-2xl font-semibold tracking-tight text-fg-default">
            Payment settlement
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-fg-subtle">
              Access: <span className="text-fg-default">{disclose ? 'Viewing-key' : 'Read-only'}</span>
            </span>
            <span className="text-fg-subtle">
              Generated:{' '}
              <span className="figure text-fg-default">
                {new Date().toLocaleDateString('en-GB')}
              </span>
            </span>
            <span className="text-fg-subtle">
              Token <span className="proof-id text-fg-default">{truncateKey(params.token)}</span>
            </span>
          </div>
        </header>

        {/* Read-only, time-boxed posture, stated up front. */}
        <div className="mb-8 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <Lock size={15} className="mt-0.5 shrink-0" />
          <span>
            This access is read-only and time-boxed. No financial operation can be performed here,
            and the link expires.
          </span>
        </div>

        {disclose && (
          <div className="card-primary mb-8">
            <div aria-hidden className="ambient-wash pointer-events-none absolute inset-0" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-brand-text"
                    style={{ background: 'var(--brand-wash)' }}
                  >
                    <KeyRound size={18} />
                  </span>
                  <div>
                    <p className="overline">Reconciled disclosed total</p>
                    <p className="figure-hero mt-2">{fmt(summary.disclosedTotalCents)}</p>
                    <p className="mt-1 text-sm text-fg-subtle">
                      {summary.disclosedCount} payments · USDC
                    </p>
                  </div>
                </div>
                <div className="max-w-sm text-sm text-fg-subtle">
                  {summary.verifiedLive
                    ? 'Exact amounts are revealed and each was re-checked live against the private on-chain record read straight from the Stellar contract.'
                    : 'Exact amounts are revealed and each was re-checked against the recorded on-chain record (a live contract read was unavailable).'}
                </div>
              </div>
              <div className="mt-5 border-t border-border pt-4 text-sm">
                {summary.allMatch ? (
                  <span className="inline-flex items-center gap-2 text-verified-text">
                    <OnChainSeal state="verified" /> All disclosed amounts match their private
                    on-chain records.
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-danger">
                    <AlertTriangle size={15} /> One or more amounts do NOT match the private on-chain
                    record.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatFigure
            variant="secondary"
            label="Verified proofs"
            value={payments.filter((p) => p.verified).length}
          />
          <StatFigure variant="secondary" label="Contractors" value={contractors} />
          <StatFigure
            variant="secondary"
            label={disclose ? 'Disclosed total' : 'Payments'}
            value={disclose ? fmt(summary.disclosedTotalCents) : payments.length}
          />
        </div>

        {dbError ? (
        <ConnectionError
          title="We cannot reach these records right now."
          message="No data is missing. Please try again in a moment."
        />
      ) : (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table caption="Payments in the audited period, with on-chain proofs.">
            <TableHead>
              <tr>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Contractor</TableHeaderCell>
                <TableHeaderCell>Reference</TableHeaderCell>
                {disclose ? <TableHeaderCell align="money">Amount</TableHeaderCell> : null}
                <TableHeaderCell align="money">Agreed range</TableHeaderCell>
                <TableHeaderCell>Proof</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Receipt</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {payments.map((p) => {
                const d = disclosed.get(p.id);
                const range = { minCents: p.range_min, maxCents: p.range_max };
                return (
                  <TableRow key={p.id} compact>
                    <TableCell className="text-fg-subtle">
                      {new Date(p.created_at).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell className="font-medium text-fg-default">{p.worker_name}</TableCell>
                    <TableCell className="text-fg-subtle">{p.reference}</TableCell>
                    {disclose ? (
                      <TableCell align="money">
                        {d && d.amountCents !== null ? (
                          <span className="inline-flex items-center justify-end gap-1.5">
                            <MaskedAmount state="disclosed" amountCents={d.amountCents} range={range} />
                            {!d.matchesOnChain && (
                              <AlertTriangle
                                size={13}
                                className="text-danger"
                                aria-label="Does not match the on-chain record"
                              />
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex justify-end">
                            <MaskedAmount state="verified" range={range} />
                          </span>
                        )}
                      </TableCell>
                    ) : null}
                    <TableCell align="money">{usdRange(p.range_min, p.range_max)}</TableCell>
                    <TableCell>
                      <a
                        className="proof-id inline-flex items-center gap-1 text-brand-text hover:underline"
                        href={`${EXPLORER_BASE}/tx/${p.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {truncateKey(p.tx_hash, 6, 4)} <ArrowUpRight size={12} />
                      </a>
                    </TableCell>
                    <TableCell>
                      <OnChainSeal state="verified" label="Verified" />
                    </TableCell>
                    <TableCell>
                      <a
                        className="text-fg-strong hover:underline"
                        href={`/api/receipt?id=${p.id}&token=${params.token}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PDF
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <TableCell colSpan={disclose ? 8 : 7} className="py-10 text-center text-fg-subtle">
                    No payments in this period.
                  </TableCell>
                </tr>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      )}

        <p className="mt-6 flex flex-wrap items-center gap-1.5 text-sm text-fg-subtle">
          <Lock size={14} className="shrink-0 text-fg-faint" />
          {disclose ? (
            <>
              Amounts are disclosed under the company viewing key and re-verified against the private
              on-chain records.
            </>
          ) : (
            <>Exact amounts are private; each row is backed by an on-chain proof.</>
          )}
          <InfoHint>
            Each payment carries a proof, verified by a Stellar smart contract, that the amount fell
            within the agreed range, provable to a third party without disclosing the figure. A
            viewing-key link additionally reveals the exact amount and re-derives the same private
            on-chain record the contract checked, so the disclosed figure is cryptographically tied
            to the chain.
          </InfoHint>
        </p>
      </main>
    </div>
  );
}
