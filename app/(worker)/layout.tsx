import { Wallet } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { TopbarActions } from '@/components/topbar-actions';
import { getSession } from '@/lib/auth/server';

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const nav = [{ href: '/payments', label: 'My payments', icon: <Wallet size={16} /> }];
  return (
    <AppShell
      title={session?.name || 'My account'}
      subtitle="Contributor"
      nav={nav}
      user={{ name: session?.name, role: session?.role }}
      actions={<TopbarActions />}
    >
      {children}
    </AppShell>
  );
}
