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
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <FileCheck size={16} className="text-brand" /> Proof of income
        <InfoHint>
          Your employer can attest on-chain, without revealing your exact monthly amounts, that your income falls within an agreed
          range over recent payments. Anyone you share it with can verify it on-chain without
          seeing any exact amount.
        </InfoHint>
      </div>

      <p className="mt-2 text-sm text-muted">
        Need to show your income to a bank, a landlord, or a consulate?{' '}
        {companyName || 'Your employer'} can issue a proof that your income sits within an agreed
        range, verifiable on-chain, without revealing any exact amount.
      </p>

      <ul className="mt-4 space-y-2 text-sm">
        {POINTS.map((l) => (
          <li key={l} className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-primary" /> {l}
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-lg border border-border bg-background/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-fg-faint">How to get yours</p>
        <p className="mt-1.5 text-sm text-muted">
          Ask {companyName || 'your company'} to issue a proof of income for you. They will send you
          a verification link you can forward to whoever needs it.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href="/verify-income" target="_blank" rel="noreferrer">
            <ShieldCheck size={14} /> Open the verifier
          </a>
        </Button>
      </div>
      <p className="mt-2 text-xs text-fg-faint">
        Already have a link from your company? Open it to check or pass it on.
      </p>
    </Card>
  );
}

const POINTS = [
  'Issued by your employer, not by you',
  'Shows a range, never your exact monthly pay',
  'Whoever you share it with verifies it on-chain, no account needed',
];
