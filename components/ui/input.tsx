import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        // Focused field is "protected, receiving input": indigo line + soft glow.
        'w-full rounded-lg border border-border bg-surface-base/60 px-3 py-2 text-sm text-fg-default',
        'placeholder:text-fg-faint outline-none transition duration-150',
        'focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
