import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn, usd, usdRange } from '@/lib/utils';

/**
 * The three-state amount control, the signature pattern of the brand. It shows
 * that a value is private by default, provably correct, and disclosed only on
 * authority. Reused wherever a sensitive amount lives: payroll detail, receipts,
 * contributor detail, the auditor view. See patterns/components/amount-disclosure.md
 * and STYLE.md Bold Bet 4.
 *
 *   masked    slate chip on surface-3 with a hairline and an indigo dot cue,
 *             carrying the agreed range. Never asterisks, never a blur.
 *   verified  the masked chip plus an emerald verified affordance (and Proof ID
 *             when known). The amount stays private; what shows is that it checked out.
 *   disclosed the real figure in mono tabular, shown only to an authorized viewer.
 */

export type AmountState = 'masked' | 'verified' | 'disclosed';

export interface MaskedAmountProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: AmountState;
  /** The agreed contractual range, in cents. Carried by the masked and verified chips. */
  range: { minCents: number; maxCents: number };
  /** The exact amount in cents. Required for the disclosed state; ignored otherwise. */
  amountCents?: number;
  /** Proof ID surfaced next to the verified affordance, when known. */
  proofId?: string | number;
}

export const MaskedAmount = React.forwardRef<HTMLSpanElement, MaskedAmountProps>(
  ({ state, range, amountCents, proofId, className, ...props }, ref) => {
    // Disclosed needs a value; without one, fall back to masked so a row never
    // renders an empty figure.
    const resolved: AmountState =
      state === 'disclosed' && typeof amountCents !== 'number' ? 'masked' : state;

    if (resolved === 'disclosed') {
      return (
        <span
          ref={ref}
          aria-live="polite"
          className={cn('figure animate-reveal text-fg-default', className)}
          {...props}
        >
          {usd(amountCents as number)} USDC
        </span>
      );
    }

    if (resolved === 'verified') {
      // Masked chip carrying the range, marked with the emerald verified affordance.
      // The exact number is still withheld; the proof is what is shown.
      return (
        <span
          ref={ref}
          className={cn(
            'inline-flex items-center gap-2 rounded-md bg-surface-3 px-2 py-0.5 ring-1 ring-inset',
            'ring-[color:var(--verified-line)] shadow-[0_0_16px_-6px_rgba(16,185,129,0.35)]',
            className,
          )}
          {...props}
        >
          <ShieldCheck size={14} strokeWidth={1.5} className="text-verified" aria-hidden />
          <span className="sr-only">Verified on-chain.</span>
          <span className="figure text-xs text-fg-subtle">{usdRange(range.minCents, range.maxCents)}</span>
          {proofId != null && (
            <span className="proof-id text-xs text-fg-subtle">Proof ID {proofId}</span>
          )}
        </span>
      );
    }

    // Masked: the private-by-default state. Slate chip on surface-3, hairline
    // border, an indigo dot at the leading edge as the protected cue.
    return (
      <span
        ref={ref}
        aria-label="Amount private, within the agreed range"
        className={cn(
          'inline-flex items-center gap-2 rounded-md bg-surface-3 py-0.5 pl-2 pr-2.5 ring-1 ring-inset ring-border',
          className,
        )}
        {...props}
      >
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand" />
        <span className="figure text-xs text-fg-subtle">{usdRange(range.minCents, range.maxCents)}</span>
      </span>
    );
  },
);
MaskedAmount.displayName = 'MaskedAmount';
