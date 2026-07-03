'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Sidebar nav item. Active reads as an indigo-tinted pill (brand wash + indigo
 * tint text + hairline ring); inactive is quiet mono on the sidebar surface,
 * lifting to a calm surface-container-high on hover. Labels are Space Mono to
 * match the Confidential Ledger nav.
 */
export function NavLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-sm transition duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'bg-brand/20 text-brand-text ring-1 ring-inset ring-brand/40'
          : 'text-fg-subtle hover:bg-surface-3 hover:text-foreground',
      )}
    >
      {children}
    </Link>
  );
}
