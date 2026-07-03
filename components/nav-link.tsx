'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'bg-surface-2 font-medium text-foreground shadow-[inset_2px_0_0_0_hsl(var(--brand))]'
          : 'text-fg-subtle hover:bg-surface-2/60 hover:text-foreground',
      )}
    >
      {children}
    </Link>
  );
}
