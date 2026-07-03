import * as React from 'react';
import { cn, usd } from '@/lib/utils';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';

/**
 * The three-state amount control, the signature pattern of the brand. It shows
 * that a value is private by default, provably correct, and disclosed only on
 * authority. Reused wherever a sensitive amount lives: payroll detail, receipts,
 * contributor detail, the auditor view. See patterns/components/amount-disclosure.md
 * and STYLE.md Bold Bet 4.
 *
 * In the Confidential Ledger system this renders through the shared signature
 * primitives, so the look stays consistent across every screen:
 *
 *   masked    the Sealed Masked Chip carrying the agreed range (lock + indigo
 *             dot + Space Mono range). Never asterisks, never a blur.
 *   verified  the Sealed Chip plus the emerald On-Chain Seal (and Proof ID when
 *             known). The amount stays sealed; what shows is that it checked out.
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
      // Sealed chip carrying the range, marked with the emerald On-Chain Seal.
      // The exact number is still withheld; the proof is what is shown.
      return (
        <span ref={ref} className={cn('inline-flex items-center gap-2', className)} {...props}>
          <OnChainSeal state="verified" />
          <SealedChip range={range} />
          {proofId != null && (
            <span className="proof-id text-xs text-fg-subtle">Proof ID {proofId}</span>
          )}
        </span>
      );
    }

    // Masked: the private-by-default state, rendered as the Sealed Masked Chip.
    return <SealedChip ref={ref} range={range} className={className} {...props} />;
  },
);
MaskedAmount.displayName = 'MaskedAmount';
