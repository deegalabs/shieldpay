import { redirect } from 'next/navigation';
import { Send, FileCheck, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CompanyForm } from '@/components/company-form';
import { BrandMark } from '@/components/ui/brand-mark';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner } from '@/lib/db/client';
import { COMPANY, DEMO_COMPANY_SUB } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/onboarding');

  // If the company already exists, onboarding is done.
  // NOTE: redirect() must run OUTSIDE try/catch (it throws a control signal).
  let existing = null;
  try {
    existing = await getCompanyByOwner(session!.sub);
  } catch {
    /* DB unreachable — let them try anyway */
  }
  if (existing) redirect('/dashboard');

  const isDemo = session!.sub === DEMO_COMPANY_SUB;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand/10">
          <BrandMark size={22} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Set up your company</h1>
        <p className="mt-1 text-sm text-muted">This takes a minute. You can change it later.</p>
      </div>

      <Card className="p-6">
        <CompanyForm
          defaults={isDemo ? { name: COMPANY.name, cnpj: COMPANY.cnpj } : undefined}
          submitLabel="Create company & continue"
          redirectTo="/dashboard"
        />
      </Card>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-muted">What happens next</p>
        <ol className="space-y-3">
          <Step done icon={<Check size={15} />} title="Set up your organization" body="Your workspace and receipt details." />
          <Step icon={<Send size={15} />} title="Run your first payroll" body="Pay your team and prove it on-chain, amounts stay private." />
          <Step icon={<FileCheck size={15} />} title="Get the verifiable receipt" body="A private, re-verifiable PDF, exact amount disclosed only under a viewing key." />
        </ol>
      </div>
    </div>
  );
}

function Step({
  done,
  icon,
  title,
  body,
}: {
  done?: boolean;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={
          'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ' +
          (done ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted')
        }
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted">{body}</p>
      </div>
    </li>
  );
}
