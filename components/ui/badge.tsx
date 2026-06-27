import * as React from 'react';
import { cn } from '@/lib/utils';

// Emerald "verified" carries a small earned glow; indigo text uses the readable
// 400 tier; the rest stay quiet (signal, not decoration).
const variants = {
  success:
    'bg-primary/10 text-primary ring-primary/30 shadow-[0_0_16px_-6px_rgba(16,185,129,0.5)]',
  brand: 'bg-brand/10 text-brand-text ring-brand/30',
  neutral: 'bg-surface-2 text-fg-subtle ring-border',
  warning: 'bg-warning/12 text-warning ring-warning/25',
  danger: 'bg-danger/12 text-danger-text ring-danger/25',
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
