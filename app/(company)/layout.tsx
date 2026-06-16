import { redirect } from 'next/navigation';
import { LayoutDashboard, Send, Users, FileText, Settings } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { TopbarActions } from '@/components/topbar-actions';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner } from '@/lib/db/client';
import { COMPANY } from '@/lib/constants';

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Company-existence gate: send first-time companies through onboarding.
  // NOTE: redirect() must run OUTSIDE try/catch (it throws a control signal).
  let company = null;
  let dbOk = true;
  if (session) {
    try {
      company = await getCompanyByOwner(session.sub);
    } catch {
      dbOk = false; // DB unreachable — don't block the UI
    }
  }
  if (session && dbOk && !company) redirect('/onboarding');
  const companyName = company?.name ?? COMPANY.name;

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { href: '/contractors', label: 'Contractors', icon: <Users size={16} /> },
    { href: '/payroll', label: 'Pay & Prove', icon: <Send size={16} /> },
    { href: '/receipts', label: 'Receipts', icon: <FileText size={16} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={16} /> },
  ];
  return (
    <AppShell
      title={companyName}
      subtitle="Company workspace"
      nav={nav}
      user={{ name: session?.name, role: session?.role }}
      actions={<TopbarActions canAudit />}
    >
      {children}
    </AppShell>
  );
}
