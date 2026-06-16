import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted/70 outline-none transition',
        'focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
