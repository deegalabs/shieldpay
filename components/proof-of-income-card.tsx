'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { FileCheck, ShieldCheck, ExternalLink, Copy, ArrowUpRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InfoHint } from '@/components/ui/tooltip';
import { EXPLORER_BASE } from '@/lib/constants';
import { truncateKey } from '@/lib/utils';

interface IssueResult {
  credentialId: string;
  nullifier: string;
  employerAx: string;
  employerAy: string;
  rangeMinCents: number;
  rangeMaxCents: number;
  verifierLabel: string;
  txHash: string;
}

/**
 * Company-side action: issue a proof of income for a recipient. It collects the
 * income range to attest and a verifier label (who the proof is for), posts to
 * the issuance route, and on success shows the shareable, on-chain-verified
 * result. Cryptography stays invisible: the copy says "proof of income" and
 * "verified on-chain", never the underlying machinery.
 */
export function ProofOfIncomeCard({
  workerAddress,
  workerName,
  defaultMinCents,
  defaultMaxCents,
}: {
  workerAddress: string;
  workerName: string;
  defaultMinCents: number;
  defaultMaxCents: number;
}) {
  const [verifierLabel, setVerifierLabel] = React.useState('');
  const [minUsdc, setMinUsdc] = React.useState(String(defaultMinCents / 100));
  const [maxUsdc, setMaxUsdc] = React.useState(String(defaultMaxCents / 100));
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<IssueResult | null>(null);
  const [periodLabel, setPeriodLabel] = React.useState(`Tax year ${new Date().getFullYear()}`);
  const [downloading, setDownloading] = React.useState(false);

  const shareUrl = result
    ? `${window.location.origin}/verify-income?n=${result.nullifier}&id=${result.credentialId}`
    : '';

  async function issue() {
    const label = verifierLabel.trim();
    if (!label) {
      toast.error('Add a label for who this proof is for.');
      return;
    }
    const rangeMinCents = Math.round(Number(minUsdc) * 100);
    const rangeMaxCents = Math.round(Number(maxUsdc) * 100);
    if (!Number.isFinite(rangeMinCents) || !Number.isFinite(rangeMaxCents) || rangeMaxCents <= 0) {
      toast.error('Enter a valid income range.');
      return;
    }
    if (rangeMinCents > rangeMaxCents) {
      toast.error('The minimum cannot be greater than the maximum.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/income/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerAddress, rangeMinCents, rangeMaxCents, verifierLabel: label }),
      });
      const data = (await res.json().catch(() => null)) as (IssueResult & { error?: string }) | null;
      if (!res.ok || !data) {
        toast.error(data?.error ?? 'Could not issue the proof of income.');
        return;
      }
      setResult(data);
      toast.success('Proof of income issued and verified on-chain.');
    } catch {
      toast.error('Could not reach the network. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadStatement() {
    const period = periodLabel.trim();
    if (!period) {
      toast.error('Add a period for the statement.');
      return;
    }
    const rangeMinCents = Math.round(Number(minUsdc) * 100);
    const rangeMaxCents = Math.round(Number(maxUsdc) * 100);
    if (!Number.isFinite(rangeMinCents) || !Number.isFinite(rangeMaxCents) || rangeMaxCents <= 0) {
      toast.error('Enter a valid income range.');
      return;
    }
    if (rangeMinCents > rangeMaxCents) {
      toast.error('The minimum cannot be greater than the maximum.');
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch('/api/income/statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerAddress, rangeMinCents, rangeMaxCents, periodLabel: period }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? 'Could not generate the income statement.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shieldpay-income-statement.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Income statement downloaded.');
    } catch {
      toast.error('Could not reach the network. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Verification link copied.');
    } catch {
      toast.error('Could not copy the link.');
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <FileCheck size={16} className="text-brand" /> Proof of income
        <InfoHint>
          Attests, in zero knowledge, that you paid this recipient a total within the range below
          over their last six payments, without revealing any single amount.
        </InfoHint>
      </div>
      <p className="mt-2 text-sm text-muted">
        Issue a shareable proof that {workerName} earned within a given range. The recipient can hand
        it to a landlord, lender, or marketplace, who verifies it on-chain without seeing exact
        amounts.
      </p>

      {!result ? (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="poi-label" className="mb-1.5 block text-sm font-medium">
              For whom (verifier label)
            </label>
            <Input
              id="poi-label"
              value={verifierLabel}
              onChange={(e) => setVerifierLabel(e.target.value)}
              placeholder="e.g. Oakwood Apartments application"
              maxLength={120}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="poi-min" className="mb-1.5 block text-sm font-medium">
                Range min (USDC)
              </label>
              <Input
                id="poi-min"
                type="number"
                min={0}
                inputMode="decimal"
                value={minUsdc}
                onChange={(e) => setMinUsdc(e.target.value)}
                className="figure"
              />
            </div>
            <div>
              <label htmlFor="poi-max" className="mb-1.5 block text-sm font-medium">
                Range max (USDC)
              </label>
              <Input
                id="poi-max"
                type="number"
                min={0}
                inputMode="decimal"
                value={maxUsdc}
                onChange={(e) => setMaxUsdc(e.target.value)}
                className="figure"
              />
            </div>
          </div>
          <Button onClick={issue} disabled={busy}>
            <ShieldCheck size={16} /> {busy ? 'Issuing…' : 'Issue proof of income'}
          </Button>
          <p className="text-xs text-fg-faint">
            Uses the recipient&apos;s six most recent payments from your company. The total must fall
            within the range you set.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between">
            <Badge variant="success">
              <ShieldCheck size={12} /> Verified on-chain
            </Badge>
            <span className="text-xs text-muted">Credential #{result.credentialId}</span>
          </div>

          <div className="mt-4 space-y-2.5 text-sm">
            <Row k="For" v={result.verifierLabel} />
            <Row
              k="Attested by employer"
              v={truncateKey(result.employerAx, 6, 6)}
              mono
            />
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-fg-subtle">Settlement transaction</span>
              <a
                href={`${EXPLORER_BASE}/tx/${result.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="figure inline-flex items-center gap-1 font-medium text-brand-text hover:underline"
              >
                {truncateKey(result.txHash, 8, 6)} <ExternalLink size={13} />
              </a>
            </div>
            <Row
              k="Proven range"
              v={`$${(result.rangeMinCents / 100).toLocaleString()} to $${(result.rangeMaxCents / 100).toLocaleString()} USDC`}
              mono
              last
            />
          </div>

          <div className="mt-5">
            <label htmlFor="poi-share" className="mb-1.5 block text-sm font-medium">
              Shareable verification link
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="poi-share" readOnly value={shareUrl} className="figure text-xs" />
              <div className="flex gap-2">
                <Button variant="ghost" size="md" onClick={copyShare} className="sm:w-auto">
                  <Copy size={14} /> Copy
                </Button>
                <Button asChild variant="ghost" size="md" className="sm:w-auto">
                  <a href={shareUrl} target="_blank" rel="noreferrer">
                    Open <ArrowUpRight size={14} />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" className="mt-4" onClick={() => setResult(null)}>
            Issue another
          </Button>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Download size={16} className="text-brand" /> Download income statement
        </div>
        <p className="mt-1.5 text-sm text-muted">
          A formal, printable statement for a bank, consulate, or tax office. It proves {workerName}
          &apos;s income falls within the range above over the period you set, verified on-chain,
          without showing exact amounts.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="poi-period" className="mb-1.5 block text-sm font-medium">
              Period
            </label>
            <Input
              id="poi-period"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="e.g. Tax year 2026 or Jan 2026 to Jun 2026"
              maxLength={80}
            />
          </div>
          <Button variant="outline" onClick={downloadStatement} disabled={downloading} className="sm:w-auto">
            <Download size={16} /> {downloading ? 'Preparing…' : 'Download statement'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Row({ k, v, mono, last }: { k: string; v: string; mono?: boolean; last?: boolean }) {
  return (
    <div
      className={['flex items-center justify-between', last ? '' : 'border-b border-border pb-2.5'].join(
        ' ',
      )}
    >
      <span className="text-fg-subtle">{k}</span>
      <span className={['font-medium text-fg-default', mono ? 'figure' : ''].join(' ')}>{v}</span>
    </div>
  );
}
