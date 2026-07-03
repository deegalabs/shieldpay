import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { NavLink } from '@/components/nav-link';
import { MobileNav } from '@/components/mobile-nav';
import { BrandMark } from '@/components/ui/brand-mark';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * The Confidential Ledger app shell: a fixed left sidebar (the shield wordmark,
 * the company/vault block in Space Grotesk + mono-label, the vertical nav with
 * an indigo-tinted active pill, and a bottom action slot), plus a slim top strip
 * that carries the page actions. On mobile it collapses to a sticky mini-header
 * with a hamburger (see MobileNav). Slots are unchanged from the previous shell
 * so the company and worker layouts keep passing the same props.
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
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop): fixed, tonal, hairline right edge. */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col gap-4 border-r border-border bg-surface-2 p-4 md:flex">
        {/* Shield wordmark */}
        <Link href="/" className="flex items-center gap-2 px-1 pt-1">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
            <BrandMark size={18} />
          </span>
          <span className="font-grotesk text-base font-semibold tracking-tight text-foreground">
            ShieldPay
          </span>
        </Link>

        {/* Company / vault block */}
        <div className="mt-2 flex flex-col gap-0.5 px-1">
          <span className="truncate font-grotesk text-xl font-semibold tracking-tight text-brand-text">
            {title}
          </span>
          {subtitle && <span className="overline truncate">{subtitle}</span>}
        </div>

        {/* Vertical nav */}
        <nav className="mt-4 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: help, private-by-default note, primary action slot. */}
        <div className="mt-auto flex flex-col gap-3">
          <NavLink href="/help">
            <HelpCircle size={16} />
            Help &amp; docs
          </NavLink>
          <p className="rounded-lg border border-border bg-surface p-3 text-xs text-fg-subtle top-edge">
            Payments backed by on-chain proofs. Exact amounts stay sealed.
          </p>
          {user?.name && (
            <div className="flex items-center gap-2.5 border-t border-border pt-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/12 font-mono text-sm font-semibold uppercase text-brand-text">
                {user.name.trim().charAt(0) || '?'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight text-fg-default">
                  {user.name}
                </p>
                {user.role && <p className="text-xs capitalize text-fg-faint">{user.role}</p>}
              </div>
            </div>
          )}
          {actions && <div className="flex flex-col gap-2">{actions}</div>}
        </div>
      </aside>

      {/* Mobile chrome */}
      <MobileNav brand={title} nav={nav} actions={actions} />

      {/* Main content, offset by the fixed sidebar on desktop. */}
      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <main className="mx-auto w-full max-w-5xl flex-1 animate-fade-in p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
