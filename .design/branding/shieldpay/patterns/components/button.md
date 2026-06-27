# Button (override)

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27
> Tier 2 override. The token defaults do not capture the indigo/emerald split.

ShieldPay has two accent buttons with distinct meaning, plus a neutral one. The key
override: the PRIMARY action is indigo (protected/brand), not emerald. Emerald is
reserved for confirm/settle actions only, because emerald is earned.

## Variants

| Variant | Class | Fill | Label | Meaning |
| --- | --- | --- | --- | --- |
| Primary | `.btn-primary` | `brand` indigo | white, 500 | the main affordance (Run payroll, Continue) |
| Verified | `.btn-verified` | `primary` emerald | `primary-foreground` ink | confirm / settle (Confirm and settle) |
| Secondary | `.btn-secondary` / `.btn-ghost` | `surface-2` | `fg-strong` | secondary, cancel, neutral |
| Danger | `.btn-danger` | `danger` red | white | destructive (rare) |

## States

| State | Treatment | Duration |
| --- | --- | --- |
| Hover | `brightness(1.10)` (accent) / step to `surface-3` + `border-strong` (secondary) | `dur-fast` 160ms |
| Active | `brightness(0.95)` | `dur-instant` |
| Focus-visible | indigo focus ring (`ring` + offset) | `dur-fast` |
| Disabled | `opacity-50`, no pointer events | instant |
| Loading | label swaps to calm inline state text; no spinner inside the button | `dur-base` |

## Usage

- One primary (indigo) per view. The emerald `btn-verified` appears only at the
  commit moment of a flow that settles funds, paired with the stepper.
- Radius `lg` (`--radius`). Label 500 weight, never 700.
- Never put the gradient on a button fill. Buttons are flat accent fills; the
  gradient is light, not paint.
- Icon + label buttons use a 16px lucide icon, `strokeWidth 1.5`.

## Accessibility

- White on indigo-500 measures 4.47:1 (AA, button-grade with the 500-weight label;
  clears the 3:1 large bar with margin). `primary-foreground #022C22` on emerald is
  5.97:1. Keep the spec'd weights.
- Focus ring is the indigo `--ring`, always visible on keyboard focus.
- Loading state announces via `aria-busy`; never rely on a spinner alone.

## Code hints

```tsx
<button className="btn-primary">Run payroll</button>
<button className="btn-verified">Confirm and settle</button>
<button className="btn-secondary">Cancel</button>
```

Definitions live in `token-mapping.md` (`@layer components`). Primary uses
`bg-brand text-white`; verified uses `bg-primary text-[hsl(var(--primary-foreground))]`;
both hover with `brightness` over `--dur-fast` `--ease-physical`.
