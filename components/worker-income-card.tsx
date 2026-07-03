import { FileCheck, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InfoHint } from '@/components/ui/tooltip';

/**
 * Worker-side proof-of-income entry. Honest by design: the worker cannot
 * self-issue (issuance requires a company session) and no credential is stored
 * per-worker, so this card explains the capability, makes clear the employer
 * issues it, and routes to the public verifier for a link the worker already
 * holds. No issue/generate button, no credentials list.
 */
export function WorkerIncomeCard({ companyName }: { companyName?: string }) {
  const employer = companyName || 'Your employer';

  return (
    <Card className="space-y-5 p-6">
      <div className="space-y-2">
        <span className="overline inline-flex items-center gap-1.5">
          <FileCheck size={13} strokeWidth={1.75} className="text-fg-subtle" aria-hidden />
          Proof of income
          <InfoHint>
            Your employer can attest on-chain that your income falls within an agreed range over
            recent payments, without revealing your exact monthly amounts. Anyone you share it with
            can verify it on-chain without seeing any exact amount.
          </InfoHint>
        </span>
        <p className="text-sm font-medium text-fg-default">Issued by your employer, not by you.</p>
      </div>

      <p className="text-sm text-fg-strong">
        Need to show your income to a bank, a landlord, or a consulate? {employer} can issue a proof
        that your income sits within an agreed range, verifiable on-chain, without revealing any
        exact amount.
      </p>

      <ul className="space-y-2 text-sm text-fg-strong">
        {POINTS.map((l) => (
          <li key={l} className="flex items-start gap-2">
            <Check size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden />
            {l}
          </li>
        ))}
      </ul>

      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <p className="overline">How to get yours</p>
        <p className="mt-1.5 text-sm text-fg-strong">
          Ask {companyName || 'your company'} to issue a proof of income for you. They will send you
          a verification link you can forward to whoever needs it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <a href="/verify-income" target="_blank" rel="noreferrer">
            <ShieldCheck size={14} /> Open the verifier
          </a>
        </Button>
        <p className="text-xs text-fg-faint">
          Already have a link from your company? Open it to check or pass it on.
        </p>
      </div>
    </Card>
  );
}

const POINTS = [
  'Issued by your employer, not by you',
  'Shows a range, never your exact monthly pay',
  'Whoever you share it with verifies it on-chain, no account needed',
];
