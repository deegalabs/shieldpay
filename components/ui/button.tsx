import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

/**
 * Indigo is the resting brand action ("protected"); emerald (`success`) is
 * reserved for confirm / settle / verified moments ("proven"). A 1px inner top
 * highlight gives solid buttons light-from-above without a drop shadow.
 */
const variants = {
  primary:
    'bg-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:brightness-110 active:brightness-95',
  brand:
    'bg-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:brightness-110 active:brightness-95',
  success:
    'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:brightness-110 active:brightness-95',
  ghost:
    'border border-border bg-surface-2 text-fg-strong hover:bg-surface-3 hover:border-border-strong',
  outline: 'border border-border bg-transparent text-fg-strong hover:bg-surface-2',
  subtle: 'bg-surface-2 text-fg-strong hover:bg-surface-3',
  danger:
    'bg-danger text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:brightness-110 active:brightness-95',
  link: 'text-brand-text underline-offset-4 hover:underline',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
          'transition-[filter,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.175,0.885,0.32,1.1)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
