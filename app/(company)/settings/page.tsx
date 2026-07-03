import { Building2, KeyRound, ShieldCheck, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CompanyForm } from '@/components/company-form';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getSession();
  let company = null;
  try {
    if (session) company = await getCompanyByOwner(session.sub);
  } catch {
    /* DB unreachable */
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="overline text-brand-text">Workspace</p>
        <h1 className="mt-1 font-headline text-2xl font-semibold tracking-tight text-fg-default">
          Settings
        </h1>
        <p className="mt-1 text-sm text-fg-subtle">
          These details appear on the verifiable receipts you generate.
        </p>
      </header>

      {/* Company profile */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-fg-subtle">
            <Building2 size={15} strokeWidth={1.75} />
          </span>
          <h2 className="text-sm font-semibold text-fg-default">Company profile</h2>
        </div>
        <Card className="p-6 shadow-edge">
          <CompanyForm
            defaults={{
              name: company?.name ?? '',
              type: company?.type ?? 'company',
              cnpj: company?.cnpj ?? '',
              treasury_address: company?.treasury_address ?? '',
              responsible_name: company?.responsible_name ?? '',
              responsible_email: company?.responsible_email ?? '',
              auditor_contact: company?.auditor_contact ?? '',
              require_invoice: company?.require_invoice ?? false,
            }}
            submitLabel="Save changes"
          />
        </Card>
      </section>

      {/* Auditor access links */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-fg-subtle">
            <KeyRound size={15} strokeWidth={1.75} />
          </span>
          <h2 className="text-sm font-semibold text-fg-default">Auditor access links</h2>
        </div>
        <Card className="space-y-4 p-6 shadow-edge">
          <p className="text-sm text-fg-subtle">
            Give an accountant or auditor a read-only, time-boxed view of your settlements. A
            viewing-key link additionally reveals exact amounts, re-verified against the chain.
            Generate links from the{' '}
            <span className="font-medium text-fg-default">Auditor access</span> menu in the top bar.
          </p>

          <div>
            <p className="overline">Link format</p>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface p-3">
              <Link2 size={14} className="shrink-0 text-fg-faint" aria-hidden />
              <code className="mono truncate text-xs text-fg-subtle">
                {'https://shieldpay.app/audit/<token>'}
              </code>
            </div>
            <p className="mt-2 text-xs text-fg-faint">
              Each link carries its own expiry. Rotating the viewing key revokes every disclosure
              link at once, dropping older links back to read-only.
            </p>
          </div>
        </Card>
      </section>

      {/* Security posture */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-fg-subtle">
            <ShieldCheck size={15} strokeWidth={1.75} />
          </span>
          <h2 className="text-sm font-semibold text-fg-default">Security</h2>
        </div>
        <Card className="p-6 shadow-edge">
          <p className="text-sm text-fg-subtle">
            Amounts are never stored in the clear: each payment keeps only its on-chain commitment
            and the agreed range. Exact figures are disclosed solely through a viewing-key link you
            control.
          </p>
        </Card>
      </section>
    </div>
  );
}
