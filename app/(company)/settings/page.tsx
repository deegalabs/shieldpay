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
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Company settings</h1>
      <p className="mt-1 text-sm text-muted">
        These details appear on the court-grade receipts you generate.
      </p>
      <Card className="mt-6 p-6">
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
    </div>
  );
}
