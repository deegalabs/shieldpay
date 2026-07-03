import * as React from 'react';
import { Lock } from 'lucide-react';
import { cn, usdRange } from '@/lib/utils';

/**
 * The Sealed Masked Chip: the Confidential Ledger control for an obscured amount.
 * A solid slate pill (surface-container-high) carrying, left to right, a tiny
 * lock glyph, a small indigo status dot, and the agreed range in Space Mono. It
 * says the exact figure is sealed, but the range it falls within is public. This
 * is the signature "privacy by default" mark; never asterisks, never a blur.
 *
 * Pass either a cents `range` (formatted with the app's usd helper) or a
 * preformatted `label` (e.g. "$40k-$50k") when the value is already display-ready.
 */

const sizes = {
  sm: { pad: 'px-2 py-0.5 gap-1.5', text: 'text-xs', icon: 12, dot: 'size-1.5' },
  md: { pad: 'px-3 py-1 gap-2', text: 'text-sm', icon: 14, dot: 'size-2' },
} as const;

export type SealedChipSize = keyof typeof sizes;

export interface SealedChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The agreed contractual range in cents. Formatted to "$450.00-$550.00". */
  range?: { minCents: number; maxCents: number };
  /** A preformatted range label, used when the value is already display-ready. */
  label?: string;
  size?: SealedChipSize;
}

export const SealedChip = React.forwardRef<HTMLSpanElement, SealedChipProps>(
  ({ range, label, size = 'sm', className, ...props }, ref) => {
    const s = sizes[size];
    const text = label ?? (range ? usdRange(range.minCents, range.maxCents) : '');
    return (
      <span
        ref={ref}
        aria-label={`Amount sealed, within the agreed range ${text}`}
        className={cn(
          'inline-flex items-center rounded-full border border-border bg-surface-3 text-fg-subtle top-edge',
          s.pad,
          className,
        )}
        {...props}
      >
        <Lock size={s.icon} strokeWidth={1.75} className="shrink-0 text-fg-subtle" aria-hidden />
        <span aria-hidden className={cn('shrink-0 rounded-full bg-brand', s.dot)} />
        <span className={cn('mono whitespace-nowrap', s.text)}>{text}</span>
      </span>
    );
  },
);
SealedChip.displayName = 'SealedChip';
