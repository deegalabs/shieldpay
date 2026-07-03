import * as React from 'react';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The money-led hero stat. This is what makes the first CFO screen read like
 * Mercury or Ramp: an overline label over one large mono figure, top-left, the
 * single biggest element on the dashboard (Operating balance, Paid this month).
 *
 * Two variants:
 *
 *   hero       the lead figure. Value in `.figure-hero` (the one sanctioned
 *              clip-to-text gradient, per STYLE.md). By default it sits in a
 *              `card-primary` cluster whose faint indigo top rim is the ambient
 *              gradient-as-light. One glowing figure per screen: use `hero` once.
 *   secondary  the quiet counts (active contributors, pending). Neutral `.figure`
 *              in `fg-default`, no glow, smaller. Use these for everything else.
 *
 * The gradient is light, never fill or paint: only the `hero` value clips it, and
 * only the `card-primary` rim carries it on the surface. Nothing else.
 */

const variants = {
  hero: {
    surface: 'card-primary',
    value: 'figure-hero text-4xl font-semibold leading-none',
  },
  secondary: {
    surface: 'card',
    value: 'figure text-2xl font-semibold leading-none text-fg-default',
  },
} as const satisfies Record<string, { surface: string; value: string }>;

export type StatFigureVariant = keyof typeof variants;

/** Direction of an optional trend delta. Rendered calm (fg-subtle), color-free. */
export type DeltaDirection = 'up' | 'down' | 'flat';

const DELTA_ICON: Record<DeltaDirection, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: ArrowRight,
};

export interface StatFigureProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The overline label, e.g. "Operating balance". */
  label: string;
  /** The figure. Pass it preformatted, e.g. `${usd(cents)} USDC` or a count. */
  value: React.ReactNode;
  variant?: StatFigureVariant;
  /** A quiet line under the figure (e.g. a unit or context). `fg-subtle`. */
  sublabel?: React.ReactNode;
  /** An optional trend delta beside the label. Kept color-free and restrained. */
  delta?: { value: string; direction?: DeltaDirection };
  /** A small leading glyph beside the label. */
  icon?: React.ReactNode;
  /**
   * Wrap in the card cluster (hero -> `card-primary`, secondary -> `card`).
   * Default true. Set false to drop the surface and place the stat inside an
   * existing container.
   */
  card?: boolean;
}

export const StatFigure = React.forwardRef<HTMLDivElement, StatFigureProps>(
  (
    { label, value, variant = 'hero', sublabel, delta, icon, card = true, className, ...props },
    ref,
  ) => {
    const v = variants[variant];
    const DeltaIcon = delta ? DELTA_ICON[delta.direction ?? 'flat'] : null;

    return (
      <div ref={ref} className={cn(card && v.surface, className)} {...props}>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-[550] uppercase tracking-[0.06em] text-fg-subtle">
            {icon}
            {label}
          </span>
          {delta && DeltaIcon && (
            <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
              <DeltaIcon size={12} strokeWidth={1.75} aria-hidden />
              <span className="figure">{delta.value}</span>
            </span>
          )}
        </div>

        <p className={cn('mt-3', v.value)}>{value}</p>

        {sublabel != null && <p className="mt-2 text-sm text-fg-subtle">{sublabel}</p>}
      </div>
    );
  },
);
StatFigure.displayName = 'StatFigure';
