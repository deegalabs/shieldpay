import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className merger (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a USDC amount (string or number) for display. */
export function formatUsdc(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

/** Truncate a Stellar address/hash for compact display: GABC…WXYZ. */
export function truncateKey(key: string, lead = 4, tail = 4): string {
  if (key.length <= lead + tail) return key;
  return `${key.slice(0, lead)}…${key.slice(-tail)}`;
}
