# Typography

> Phase: identity | Brand: ShieldPay | Generated: 2026-06-27

---

## The stack

```
Body / UI:        Inter           (set at a ~450 register, not 400)
Headings/display: Inter Display    (the display optical size of Inter)
Figures/IDs:      Geist Mono       (primary), JetBrains Mono (fallback)
```

We keep Inter. It is brand equity, it is finance-grade, and it carries the calm,
neutral authority the Guardian/Steward voice needs. The evolution is to add two
specialized tiers around it so the body is not doing every job at once.

## Why this stack (tied to voice)

Our voice is **Calm, Precise, Trustworthy**, and the type has to say all three
before a word is read.

- **Inter at a ~450 register for body.** A hair heavier than default 400. It reads
  as "set with authority," the Mercury insight: text that is placed deliberately,
  not defaulted. This is calm with backbone, not loud. It serves Boldness 2 and
  Warmth 2: confident, cool, never shouty.
- **Inter Display for headings.** Adding the display optical size (Linear's exact
  move) gives us a real display tier with tighter spacing and more refined
  contrast, expression without introducing a second brand face. It keeps the
  family coherent while letting headings feel composed rather than scaled-up body.
- **Geist Mono for every figure, hash, and ID.** This is the Steward made visible.
  Amounts, ledger numbers, proof IDs, and transaction hashes are the product's
  load-bearing truth, and they must be exact, aligned, and unmistakable. A mono
  face with tabular figures is the cheapest, clearest credibility win we have
  (Precision 5). JetBrains Mono is the fallback if Geist Mono is unavailable in a
  given environment.

## The 4-rung text-color hierarchy

Type pairs with the four foreground tiers from the color system, so weight and
color work together to build hierarchy without ornament (Contrast 4, Density 4).

```
fg-default  (0.98)   headings, lead figures, verified amounts
fg-strong   (0.86)   body copy, primary labels
fg-subtle   (0.66)   secondary text, table metadata, column headers
fg-faint    (0.45)   captions, helper text, disabled
```

Hierarchy is carried by tier and weight, not by color accents. Indigo and emerald
are never used to color text for emphasis; they are signal, not highlighter.

## Figure discipline (non-negotiable)

This is where the Steward earns trust. Every number that represents money,
identity, or proof follows these rules:

- **Tabular numerals always.** `font-variant-numeric: tabular-nums` on every
  amount, ledger number, proof ID, count, and date so digits align in columns and
  never shift between rows. The token was named before but not applied; here it is
  mandatory.
- **Mono for figures, hashes, and IDs.** Amounts, transaction hashes, and proof
  IDs render in Geist Mono. Labels and prose stay in Inter. The mono face signals
  "this is a precise value you can check," matching the prove-don't-promise value.
- **Right-align currency columns.** In any table, currency right-aligns so the
  decimal points stack. The reader scans magnitudes at a glance.
- **Format exactly, every time.** `$500.00 USDC`, `ledger 58,204,113`,
  `Proof ID 789`. To the cent, with separators, consistent everywhere. Loose
  numbers are a Steward failure.

## Scale direction

Dense-but-legible and precision-led (Density 4, Legibility 5). The direction, not
the math:

- A tight type scale with clear, deliberate steps. Headings step down quickly into
  a calm body size that holds dense tables without crowding.
- Tight letter-spacing on headings (Inter Display already leans this way); normal
  tracking on body for sustained reading; mono figures at their natural spacing.
- Body line-height generous enough to keep audit tables scannable at the 52px
  standard / 44px compact row heights; headings tighter.
- One body size does most of the work. Resist a sprawl of sizes; hierarchy comes
  from the four tiers, weight, and the mono/Inter split, not from many type sizes.

The exact modular scale, line-heights, weights as numbers, and font-loading
strategy are computed in execution by the typography skill. This chunk fixes the
faces, the rationale, the four-rung pairing, and the figure discipline.

---

## Type scale (execution layer)

Ratio **1.200 (minor third)**, base **16px / 1rem**. A tight, calm progression:
headings step down quickly into a body that holds dense tables. Display sizes
get a `clamp()` so they breathe on marketing surfaces and stay compact in-app.
Tracking is negative on display, neutral on body, positive on overlines.

| Token | px | rem | Fluid clamp | Weight | Line-height | Tracking | Face / use |
| --- | --- | --- | --- | --- | --- | --- | --- |
| display-2xl | 48 | 3.000 | `clamp(2.25rem, 1.6rem + 2.6vw, 3rem)` | 600 | 1.05 | -0.03em | Inter Display, landing hero |
| display-xl | 40 | 2.500 | `clamp(2rem, 1.6rem + 1.6vw, 2.5rem)` | 600 | 1.10 | -0.025em | Inter Display, section hero |
| h1 | 33 | 2.074 | `clamp(1.75rem, 1.5rem + 1vw, 2.074rem)` | 600 | 1.15 | -0.02em | Inter Display, page title |
| h2 | 28 | 1.728 | — | 600 | 1.20 | -0.015em | Inter Display, section |
| h3 | 23 | 1.440 | — | 600 | 1.25 | -0.01em | Inter Display, card title |
| body-lg | 19 | 1.200 | — | 450 | 1.55 | 0 | Inter, lead paragraph |
| body | 16 | 1.000 | — | 450 | 1.55 | 0 | Inter, default body |
| body-sm | 14 | 0.875 | — | 450 | 1.45 | 0 | Inter, dense rows, secondary |
| caption | 13 | 0.813 | — | 450 | 1.40 | 0 | Inter, captions/meta |
| overline | 12 | 0.750 | — | 550 | 1.30 | +0.06em | Inter, uppercase labels |
| mono-figure | 14-16 | inherits | — | 480 | 1.40 | 0 | Geist Mono, amounts/IDs |

Notes:
- **One body size does the work.** Tables run at `body-sm` (14px) for density;
  reading surfaces at `body` (16px). Resist size sprawl: hierarchy is tier +
  weight + the Inter/mono split, not many sizes (Density 4, Legibility 5).
- **Row heights** from the color/elevation spec: 52px standard, 44px compact.
  `body-sm` at line-height 1.45 sits cleanly inside both.
- **Inter "register" 450** is a variable-font weight between Regular (400) and
  Medium (500). If only static weights are available, use 500 for labels and 400
  for long body, and accept the half-step loss.

## Weight map

```
Inter        body 450 · labels/strong 500 · overline 550
Inter Display headings 600 · hero 600 (never 700; Boldness 2 keeps it composed)
Geist Mono   figures 480 · emphasised figures 500
```

## Figure rendering (CSS contract)

```css
.figure, td.amount, .proof-id, .hash {
  font-family: var(--font-mono);          /* Geist Mono, JetBrains Mono fallback */
  font-variant-numeric: tabular-nums;     /* digits never shift between rows */
  font-feature-settings: "tnum" 1, "ss01" 1;
}
td.amount { text-align: right; }          /* decimals stack, magnitudes scan */
```

Tabular numerals are mandatory on every amount, ledger number, proof ID, count,
and date, including Inter contexts (Inter ships `tnum`). Currency columns
right-align; prose figures stay inline in Inter with `tnum` on.

## Font loading (next/font)

Self-hosted and optimized through `next/font`, no external requests, no layout
shift. Inter and Inter Display are the same variable family driven by the optical
size axis.

```ts
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

// Inter variable: weight range + optical sizing gives both body and display
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  axes: ['opsz'],           // enables the Display optical size
  display: 'swap',
});

// Geist Mono (self-hosted variable file) for figures, hashes, IDs
export const geistMono = localFont({
  src: './fonts/GeistMono[wght].woff2',
  variable: '--font-mono',
  weight: '400 600',
  display: 'swap',
});
```

Apply `font-optical-sizing: auto` globally so headings pick up the Display cut
automatically at large sizes. JetBrains Mono is the fallback in the `--font-mono`
stack if the Geist Mono file is absent. Body gets `swap`; nothing here justifies
a flash-of-invisible-text on a finance dashboard.

---

## Related
- [logo-directions.md](./logo-directions.md)
- [color-system.md](./color-system.md)
- [imagery-style.md](./imagery-style.md)
- [brand-applications.md](./brand-applications.md)
- [../strategy/INDEX.md](../strategy/INDEX.md)
- [../discover/mood-board-direction.md](../discover/mood-board-direction.md)
