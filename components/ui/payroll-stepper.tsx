import * as React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Payroll stepper. The one place motion earns its keep: it animates the brand's
 * core meaning, protected becoming proven, by traveling the connector from indigo
 * to emerald as a run advances. Discrete and stepped, one stage at a time. No
 * spinner, no loop. See patterns/components/payroll-stepper.md and STYLE.md
 * Bold Bet 5.
 */

// The four stages a run passes through, left to right. The union drives the whole
// component; the payroll page maps its onProgress strings onto it.
export type PayrollPhase = 'sending' | 'proving' | 'verifying' | 'settled';

const STAGES = [
  { phase: 'sending', label: 'Sending' },
  { phase: 'proving', label: 'Proving' },
  { phase: 'verifying', label: 'Verifying' },
  { phase: 'settled', label: 'Settled' },
] as const satisfies ReadonlyArray<{ phase: PayrollPhase; label: string }>;

type NodeState = 'pending' | 'active' | 'done' | 'settled' | 'failed';

// Node fill and ring per state, from the tokens only. Active carries the indigo
// focus glow; settled lands emerald with the one-time confirm ring; failed reads
// danger. State is also carried by shape (check / cross) and text, never color alone.
const nodeStyle = {
  pending: 'bg-surface-2 shadow-[inset_0_0_0_1px_hsl(var(--border-strong))] text-fg-faint',
  active: 'bg-brand text-white shadow-[0_0_0_3px_rgba(99,102,241,0.18)] animate-reveal',
  done: 'bg-brand text-white',
  settled: 'bg-verified text-primary-foreground animate-confirm',
  failed: 'bg-danger text-white',
} as const satisfies Record<NodeState, string>;

const SR_STATE: Record<NodeState, string> = {
  pending: 'pending',
  active: 'in progress',
  done: 'complete',
  settled: 'complete',
  failed: 'failed',
};

export interface PayrollStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The stage the run is currently on. */
  phase: PayrollPhase;
  /** When set, the current stage halts and reads danger; the run stopped there. */
  error?: boolean;
  /** Optional tabular counter, e.g. "12 of 12 paid". */
  counter?: string;
}

export const PayrollStepper = React.forwardRef<HTMLDivElement, PayrollStepperProps>(
  ({ phase, error = false, counter, className, ...props }, ref) => {
    const current = STAGES.findIndex((s) => s.phase === phase);
    const active = current < 0 ? 0 : current;
    const isLast = (i: number) => i === STAGES.length - 1;

    const stateOf = (i: number): NodeState => {
      if (error && i === active) return 'failed';
      if (i < active) return 'done';
      if (i === active) return isLast(i) ? 'settled' : 'active';
      return 'pending';
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <ol role="status" aria-live="polite" className="flex items-start">
          {STAGES.map((stage, i) => {
            const state = stateOf(i);
            // The connector after this node fills once the run has reached the next
            // node (indigo at the start, emerald at the settled end).
            const filled = i < active;
            return (
              <React.Fragment key={stage.phase}>
                <li className="flex min-w-0 flex-col items-center gap-2">
                  <span
                    className={cn(
                      'grid size-7 place-items-center rounded-full transition-colors motion-reduce:transition-none',
                      nodeStyle[state],
                    )}
                  >
                    {state === 'failed' ? (
                      <X size={14} strokeWidth={2.25} aria-hidden />
                    ) : state === 'done' || state === 'settled' ? (
                      <Check size={14} strokeWidth={2.25} aria-hidden />
                    ) : null}
                    <span className="sr-only">
                      {stage.label}, {SR_STATE[state]}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      state === 'pending' ? 'text-fg-subtle' : 'text-fg-strong',
                      state === 'failed' && 'text-danger-text',
                    )}
                  >
                    {stage.label}
                  </span>
                </li>
                {!isLast(i) && (
                  <span
                    aria-hidden
                    className="mt-3.5 h-0.5 flex-1 rounded-full transition-[background-size] duration-[var(--dur-base)] [transition-timing-function:var(--ease-physical)] motion-reduce:transition-none"
                    style={{
                      background:
                        'linear-gradient(90deg, hsl(var(--brand)), hsl(var(--verified))) left / var(--sweep) 100% no-repeat, hsl(var(--border))',
                      ['--sweep' as string]: filled ? '100%' : '0%',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>
        {counter && (
          <p className="figure mt-3 text-center text-xs text-fg-subtle">{counter}</p>
        )}
      </div>
    );
  },
);
PayrollStepper.displayName = 'PayrollStepper';
