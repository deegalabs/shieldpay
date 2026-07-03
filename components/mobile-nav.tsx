'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle, Menu, X } from 'lucide-react';
import { NavLink } from '@/components/nav-link';
import { BrandMark } from '@/components/ui/brand-mark';
import type { NavItem } from '@/components/app-shell';
import { cn } from '@/lib/utils';

/**
 * Mobile chrome for the Confidential Ledger shell: a sticky mini-header carrying
 * the brand mark and a hamburger, plus a collapsible nav panel. Per DESIGN.md
 * mobile rules, the sidebar collapses to this on small viewports.
 */
export function MobileNav({
  brand,
  nav,
  actions,
}: {
  brand: string;
  nav: NavItem[];
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  return (
    <div className="md:hidden">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="flex items-center gap-2" onClick={close}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
            <BrandMark size={18} />
          </span>
          <span className="font-grotesk text-base font-semibold tracking-tight">ShieldPay</span>
        </Link>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface-2 text-fg-strong hover:bg-surface-3"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <nav
        className={cn(
          'overflow-hidden border-b border-border bg-surface-2 transition-[max-height] duration-200',
          open ? 'max-h-96' : 'max-h-0',
        )}
      >
        <div className="flex flex-col gap-1 p-3">
          <div className="overline px-3 pb-1 text-fg-faint">{brand}</div>
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} onNavigate={close}>
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
          <NavLink href="/help" onNavigate={close}>
            <HelpCircle size={16} />
            <span className="whitespace-nowrap">Help &amp; docs</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
