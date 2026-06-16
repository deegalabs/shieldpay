import { LayoutDashboard, Send } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { TopbarActions } from '@/components/topbar-actions';
import { getSession } from '@/lib/auth/server';
import { COMPANY } from '@/lib/constants';

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { href: '/payroll', label: 'Pay & Prove', icon: <Send size={16} /> },
  ];
  return (
    <AppShell
      title={COMPANY.name}
      subtitle="Company workspace"
      nav={nav}
      user={{ name: session?.name, role: session?.role }}
      actions={<TopbarActions canAudit />}
    >
      {children}
    </AppShell>
  );
}
