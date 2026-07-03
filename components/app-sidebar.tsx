'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, ShieldCheck, LifeBuoy, Menu, X } from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-mark';
import type { NavItem } from '@/components/app-shell';

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
  nav,
  actions,
}: {
  title: string;
  nav: NavItem[];
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Desktop Side Nav */}
      <nav className="hidden md:flex flex-col h-screen sticky top-0 bg-slate-900 border-r border-slate-800 w-64">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <BrandMark size={40} className="w-10 h-10 rounded-md" />
            <div>
              <div className="font-headline text-slate-50 font-medium leading-tight">{title}</div>
              <div className="font-mono text-[10px] uppercase text-slate-500 tracking-wider">
                Verified Treasury
              </div>
            </div>
          </div>
          <Link
            href="/payroll"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200"
          >
            <Plus size={18} />
            <span className="text-sm font-headline">New Payment</span>
          </Link>
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
          {actions && <div className="pt-2">{actions}</div>}
        </div>
      </nav>

      {/* Mobile TopNav Fallback (hidden on md+) */}
      <nav className="md:hidden flex justify-between items-center w-full px-4 h-16 bg-slate-950 border-b border-slate-800/50 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <BrandMark size={28} className="h-7 w-7 rounded-md" />
          <div className="font-headline font-bold text-slate-50 tracking-tight text-xl">{title}</div>
        </div>
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-lg text-slate-400 hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile drawer: same nav + footer + actions as the desktop sidebar. */}
      {open && (
        <div className="md:hidden border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-md">
          <div className="px-4 py-4 flex flex-col gap-1">
            <Link
              href="/payroll"
              onClick={close}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 mb-3"
            >
              <Plus size={18} />
              <span className="text-sm font-headline">New Payment</span>
            </Link>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={
                  isActive(item.href)
                    ? 'flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-50 bg-slate-800/50 border-r-2 border-indigo-500 font-mono text-xs uppercase tracking-widest'
                    : 'flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 font-mono text-xs uppercase tracking-widest hover:bg-slate-800/30 hover:text-slate-300'
                }
              >
                <span className={isActive(item.href) ? 'text-indigo-400 flex items-center' : 'flex items-center'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
            {actions && <div className="pt-3 mt-2 border-t border-slate-800">{actions}</div>}
          </div>
        </div>
      )}
    </>
  );
}
