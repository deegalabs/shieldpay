import * as React from 'react';
import { Check, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The On-Chain Seal: a small emerald circular badge with a check "mint-mark",
 * the wax-press that signifies a transaction finalized and proven on the ledger.
 * A perfect circle by design (DESIGN.md "The Seal"). Emerald is reserved for
 * this proven state; the computing state instead shows a quiet slate hourglass
 * so the two never read as color alone.
 *
 * Pass a `label` to render the seal beside a short caption (e.g. "Verified
 * on-chain"); omit it for the bare circular mark used inside dense tables.
 */

export type OnChainSealState = 'verified' | 'computing';

const sizes = {
  sm: { ring: 'size-6', icon: 14 },
  md: { ring: 'size-8', icon: 16 },
} as const;

export type OnChainSealSize = keyof typeof sizes;

export interface OnChainSealProps extends React.HTMLAttributes<HTMLSpanElement> {
  state?: OnChainSealState;
  /** Optional caption rendered to the right of the circular mark. */
  label?: string;
  size?: OnChainSealSize;
}

export const OnChainSeal = React.forwardRef<HTMLSpanElement, OnChainSealProps>(
  ({ state = 'verified', label, size = 'sm', className, ...props }, ref) => {
    const s = sizes[size];
    const verified = state === 'verified';
    const srText = verified ? 'Verified on-chain' : 'Computing proof';

    const mark = (
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-full border',
          s.ring,
          verified
            ? 'border-verified/30 bg-verified/15 text-verified-text shadow-[0_0_16px_-6px_rgba(16,185,129,0.5)]'
            : 'border-border bg-surface-3 text-fg-subtle',
        )}
      >
        {verified ? (
          <Check size={s.icon} strokeWidth={2.25} aria-hidden />
        ) : (
          <Hourglass size={s.icon} strokeWidth={1.75} aria-hidden />
        )}
      </span>
    );

    if (!label) {
      return (
        <span ref={ref} className={cn('inline-flex', className)} {...props}>
          {mark}
          <span className="sr-only">{srText}</span>
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-2', className)}
        {...props}
      >
        {mark}
        <span
          className={cn(
            'overline',
            verified ? 'text-verified-text' : 'text-fg-subtle',
          )}
        >
          {label}
        </span>
      </span>
    );
  },
);
OnChainSeal.displayName = 'OnChainSeal';
