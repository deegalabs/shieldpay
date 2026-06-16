import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-primary text-primary-foreground shadow-card hover:brightness-110 active:brightness-95',
  brand: 'bg-brand text-white shadow-card hover:brightness-110 active:brightness-95',
  ghost: 'border border-border bg-surface/50 text-foreground hover:bg-surface-2',
  outline: 'border border-border bg-transparent text-foreground hover:bg-surface',
  subtle: 'bg-surface-2 text-foreground hover:brightness-110',
  danger: 'bg-danger text-white hover:brightness-110',
  link: 'text-accent underline-offset-4 hover:underline',
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
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
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
