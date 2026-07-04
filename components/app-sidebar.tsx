'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, ShieldCheck, LifeBuoy, X } from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-mark';
import { DemoSwitcher } from '@/components/demo-switcher';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/components/app-shell';

/** Slots shown on the mobile bottom tab bar. The rest live in the account menu. */
const MOBILE_TABS = 4;

/**
 * The Executive Ledger app shell chrome, reproduced 1:1 from the Stitch export
 * (temp/.../shieldpay_executive_ledger_dashboard/code.html). Raw Tailwind classes
 * from the reference are used verbatim: a fixed 256px left sidebar (company block
 * + "New Payment" indigo button + vertical nav + Security/Support footer), and
 * a md:hidden top mini-header with a hamburger drawer carrying the same nav.
 * Active-link state is derived from the pathname (indigo-tinted pill + right
 * rule). The desktop and mobile navs are siblings so the parent flex container
 * lays them out as [sidebar | main] on md+ and [mini-header, main] below md.
 */
export function AppSidebar({
  title,
  subtitle,
  nav,
  user,
  actions,
  primaryAction,
  demoRole,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  user?: { name?: string; role?: string };
  actions?: React.ReactNode;
  primaryAction?: { href: string; label: string };
  demoRole?: 'company' | 'worker';
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const menuRef = React.useRef<HTMLDivElement>(null);

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Close the account menu on outside click.
  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Nav items beyond the bottom tab bar fold into the account menu.
  const overflowNav = nav.slice(MOBILE_TABS);
  const initial = (user?.name?.trim()?.[0] ?? 'A').toUpperCase();

  return (
    <>
      {/* Desktop Side Nav. z-30 lifts the whole sidebar (and any popovers that
          overhang into the main canvas, e.g. the auditor menu) above <main>,
          which sits later in the DOM with overflow-hidden and would otherwise
          paint over the overhang and clip it. */}
      <nav className="hidden md:flex flex-col h-screen sticky top-0 z-30 bg-slate-900 border-r border-slate-800 w-64">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <BrandMark size={40} className="w-10 h-10 rounded-md" />
            <div>
              <div className="font-headline text-slate-50 font-medium leading-tight">{title}</div>
              <div className="font-mono text-[10px] uppercase text-slate-500 tracking-wider">
                {subtitle ?? 'Verified Treasury'}
              </div>
            </div>
          </div>
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200"
            >
              <Plus size={18} />
              <span className="text-sm font-headline">{primaryAction.label}</span>
            </Link>
          )}
        </div>
        {/* Navigation Links */}
        <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
          {nav.map((item) =>
            isActive(item.href) ? (
              <Link
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-50 bg-slate-800/50 border-r-2 border-indigo-500 transition-all duration-200 ease-in-out"
                href={item.href}
              >
                <span className="text-indigo-400 flex items-center">{item.icon}</span>
                <span className="font-mono text-xs uppercase tracking-widest">{item.label}</span>
              </Link>
            ) : (
              <Link
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 font-mono text-xs uppercase tracking-widest hover:bg-slate-800/30 hover:text-slate-300 transition-all duration-200 ease-in-out"
                href={item.href}
              >
                <span className="flex items-center">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ),
          )}
        </div>
        {/* Footer Links */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-1 px-3">
          <Link
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:bg-slate-800/30 hover:text-slate-300 transition-all duration-200 ease-in-out"
            href="/settings"
          >
            <ShieldCheck size={14} />
            <span className="font-mono text-[10px] uppercase tracking-widest">Security</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:bg-slate-800/30 hover:text-slate-300 transition-all duration-200 ease-in-out"
            href="/help"
          >
            <LifeBuoy size={14} />
            <span className="font-mono text-[10px] uppercase tracking-widest">Support</span>
          </Link>
          {demoRole && (
            <div className="pt-2">
              <DemoSwitcher current={demoRole} />
            </div>
          )}
          {actions && <div className="pt-2">{actions}</div>}
        </div>
      </nav>

      {/* Mobile top bar: brand on the left, account avatar on the right. Primary
          navigation lives in the bottom tab bar; the avatar opens an account
          menu with everything else (overflow nav, Security, Support, actions).
          Per the Stitch mobile prints (avatar top-right + bottom tabs). */}
      <div ref={menuRef} className="md:hidden">
        <nav className="flex justify-between items-center w-full px-4 h-16 bg-slate-950 border-b border-slate-800/50 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <BrandMark size={28} className="h-7 w-7 rounded-md" />
            <div className="font-headline font-bold text-slate-50 tracking-tight text-xl">{title}</div>
          </div>
          <button
            type="button"
            aria-label={open ? 'Close account menu' : 'Open account menu'}
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'grid h-10 w-10 place-items-center rounded-full border font-headline text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              open
                ? 'border-indigo-500/60 bg-slate-800 text-slate-100'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-slate-100',
            )}
          >
            {open ? <X size={18} /> : initial}
          </button>
        </nav>

        {/* Account menu: overflow nav + Security/Support + actions. */}
        {open && (
          <>
            <div aria-hidden className="fixed inset-0 top-16 z-40 bg-slate-950/50" onClick={close} />
            <div className="absolute right-3 top-[calc(4rem+0.5rem)] z-50 w-64 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.75)]">
              <div className="border-b border-slate-800 px-4 py-3">
                <div className="font-headline text-sm text-slate-100">{user?.name || 'Account'}</div>
                {user?.role && (
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                    {user.role}
                  </div>
                )}
              </div>
              <div className="flex flex-col p-2">
                {overflowNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide transition-colors',
                      isActive(item.href)
                        ? 'bg-slate-800/60 text-slate-50'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200',
                    )}
                  >
                    <span className={isActive(item.href) ? 'text-indigo-400' : ''}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                <Link
                  href="/help"
                  onClick={close}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-400 transition-colors hover:bg-slate-800/40 hover:text-slate-200"
                >
                  <LifeBuoy size={14} /> Support
                </Link>
              </div>
              {demoRole && (
                <div className="border-t border-slate-800 p-3">
                  <DemoSwitcher current={demoRole} />
                </div>
              )}
              {actions && <div className="border-t border-slate-800 p-3">{actions}</div>}
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom tab bar: quick access to the primary destinations, per the
          Stitch mobile prints (e.g. proof_explorer_mobile). Everything else lives
          in the account menu opened from the top-right avatar. */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-slate-800 bg-slate-950/95 backdrop-blur-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {nav.slice(0, MOBILE_TABS).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2.5 min-h-[56px] text-center leading-tight transition-colors duration-150',
                active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {active && (
                <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-500" />
              )}
              <span className="flex items-center">{item.icon}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
