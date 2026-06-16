import * as React from 'react';
import { cn } from '@/lib/utils';

const variants = {
  success: 'bg-primary/12 text-primary ring-primary/20',
  brand: 'bg-brand/12 text-brand ring-brand/20',
  neutral: 'bg-surface-2 text-muted ring-border',
  warning: 'bg-warning/12 text-warning ring-warning/20',
  danger: 'bg-danger/12 text-danger ring-danger/20',
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
