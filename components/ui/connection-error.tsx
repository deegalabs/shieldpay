import * as React from 'react';
import { CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The calm connection-error state. When a server page's database read throws,
 * the app today swallows it into a success-looking empty state ("No payments
 * yet"), which quietly misleads. This panel says the honest thing in the
 * sanctioned voice, finance-grade and not alarming: no red, no crash chrome, a
 * muted icon on a neutral surface. A later task swaps it into the server pages'
 * catch blocks.
 *
 * The reassurance "No payment was made." matters most on the pages that move
 * money; it is the default second line and can be overridden per surface.
 */

export interface ConnectionErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Overrides the reassurance line under the title. Keep it short and calm. */
  message?: string;
  /** Overrides the title line. */
  title?: string;
}

export const ConnectionError = React.forwardRef<HTMLDivElement, ConnectionErrorProps>(
  ({ message, title, className, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn('card flex flex-col items-center gap-3 p-8 text-center', className)}
      {...props}
    >
      <span
        aria-hidden
        className="grid size-10 place-items-center rounded-xl bg-surface-2 text-fg-subtle"
      >
        <CloudOff size={20} strokeWidth={1.5} />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-fg-strong">
          {title ?? 'We cannot reach your records right now.'}
        </p>
        <p className="text-sm text-fg-subtle">
          {message ?? 'No payment was made. Please try again in a moment.'}
        </p>
      </div>
    </div>
  ),
);
ConnectionError.displayName = 'ConnectionError';
