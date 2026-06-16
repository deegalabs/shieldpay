import Link from 'next/link';
import { ShieldCheck, HelpCircle } from 'lucide-react';
import { NavLink } from '@/components/nav-link';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Authenticated app shell: brand + sidebar nav + topbar (title, user, actions).
 * Used by the company and worker route-group layouts.
 */
export function AppShell({
  title,
  subtitle,
  nav,
  user,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  user?: { name?: string; role?: string };
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/40 p-4 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand">
            <ShieldCheck size={18} />
          </span>
          <span className="font-semibold tracking-tight">ShieldPay</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <NavLink href="/help">
            <HelpCircle size={16} />
            Help &amp; docs
          </NavLink>
          <div className="rounded-lg border border-border bg-surface-2/40 p-3 text-xs text-muted">
            Payments backed by on-chain proofs. Exact amounts stay private.
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-surface/30 px-6 py-3.5 backdrop-blur">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {user?.name && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                {user.role && <p className="text-xs capitalize text-muted">{user.role}</p>}
              </div>
            )}
            {actions}
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 animate-fade-in p-6">{children}</main>
      </div>
    </div>
  );
}
