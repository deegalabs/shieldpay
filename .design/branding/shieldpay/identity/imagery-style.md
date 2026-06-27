# Imagery and Iconography Style

> Phase: identity | Brand: ShieldPay | Generated: 2026-06-27

---

ShieldPay's imagery budget is near zero (Ornamentation 1). The product is a
finance instrument, and the only expressive element in the whole identity is the
gradient-as-light. There is no illustration system, no photography, no decorative
art to maintain. What reads as "designed" is depth, precision, and one disciplined
confirm-motion, not pictures.

## The primary visual element: gradient-as-light atmosphere

The indigo to emerald gradient, deployed as dimensional light, does the work that
illustration would do elsewhere. It is the brand's one piece of atmosphere:

- A low-intensity ambient gradient behind the page canvas (`surface-base`), so the
  dark has depth rather than reading as flat black.
- The hero lead-number wash, the surface-edge rim, and the verified glow described
  in the color system.
- It is always light, never paint: low intensity, soft falloff, 135deg, sitting
  behind content, never a hard blob or a busy texture.

This is the Guardian's atmosphere: deep, calm, contained, with a single coherent
light. Nothing competes with it.

## What we explicitly reject

- **No stock photos of people.** No smiling teams, no handshakes, no offices. The
  protagonists are the CFO, the contributor, and the auditor doing real work; the
  product itself is the hero surface, not a lifestyle image.
- **No crypto cliches.** No glowing chains, no neon, no circuit-board textures, no
  hoodies, no 3D coins, no "blockchain" abstractions. The cryptography is
  invisible by rule; visual crypto tropes would break the entire positioning.
- **No decorative illustration.** No spot illustrations, no mascots, no friendly
  characters. That is Deel's warm register, and we are deliberately cooler and
  more rigorous (Warmth 2).
- **No gradients-as-decoration.** The gradient earns its place only as light tied
  to meaning (protected, then proven). It is never a decorative fill on a card, a
  button, or a divider.

## Iconography direction

Thin-stroke line icons from the Lucide family, calm and supporting, never
dominant. Direction, not library specifics:

- **1.5 stroke weight, rounded joins**, consistent across the set, matching the
  precision and calm of the type. Icons sit at `fg-subtle` by default and only
  brighten to `fg-strong` or pick up accent color when they carry real state.
- **Icons support, they do not decorate.** An icon appears when it speeds
  recognition (a row action, a status, a nav item), not to fill space. A dense
  audit table needs fewer icons, not more.
- **lucide ShieldCheck stays reserved for the functional verified badge**, kept
  distinct from the brand mark so status and identity never compete (see
  logo-directions).

## The signature states as first-class UI motifs

The masked to verified to disclosed sequence is the recurring graphic device,
treated as designed states rather than ad-hoc styling. It appears wherever a
sensitive amount lives:

- **Masked:** a deliberate, designed slate chip standing in for the figure, with
  the indigo protected cue. Never asterisks, never a crude blur, never a redaction
  bar. It should look intentional and calm, like a value held on purpose.
- **Verified:** the emerald badge plus a tabular proof ID, confirming correctness
  without revealing the number.
- **Disclosed:** the real tabular figure, revealed for an authorized auditor with
  a brief indigo to emerald reveal motion.

## The negative-space slit as a recurring device

The privacy slit from the lead logo direction is a graphic motif, not only a logo
detail. It can recur, sparingly, as: the cut in empty-state and section glyphs,
the shape of a divider accent on a key card, or the form of the masked-amount
chip's reveal edge. Used with restraint so it stays a signature, not a pattern.

## Data-visualization restraint

Charts are rare and calm. When data viz appears, it follows the same rules: a
single neutral series with at most one indigo-or-emerald accent line for the value
that matters, no gradients-as-fill under areas, no 3D, no multi-color palettes,
tabular figures on every axis label and tooltip. A chart is a precise instrument
reading, not a marketing graphic. Most of the time, a well-set table beats a
chart, and we prefer the table.

CSS recipes, exact icon names, sizes, and chart library choices are enriched in
execution by the visuals and icons skills. This chunk fixes the direction and the
hard rejections.

---

## Icon system (execution layer)

**Library: Lucide** (`lucide-react`), already idiomatic to the shadcn/Radix stack.
Single library, no mixing, so stroke and grid stay uniform.

- **Standard:** `strokeWidth={1.5}`, `absoluteStrokeWidth` so the stroke does not
  thicken when scaled, 24x24 grid, round caps and joins (matches the type and the
  mark).
- **Size system:** `14` (inline with body-sm / dense rows), `16` (default UI,
  buttons, nav), `20` (section headers, empty-state glyph), `24` (feature/marketing
  only). Avoid in-between sizes.
- **Color:** default `text-fg-subtle`; brighten to `text-fg-strong` on hover/active
  or when the icon carries state; use `text-brand` (indigo) or `text-verified`
  (emerald) only when the icon IS the signal (focus, verified). Never a third hue.
- **Container treatment (optional, for nav/feature tiles):** icon centered in a
  `size-8` to `size-10` tile, `rounded-lg`, `bg-surface-2` with a hairline border,
  or `bg-brand/8` with `text-brand` when it marks a protected/primary affordance.
  No glow on functional icon tiles; glow is reserved for the gradient-as-light.
- **Reserved:** `ShieldCheck` = verified badge only. `Shield`, `Lock`, `Eye`/
  `EyeOff` (masked/disclosed), `BadgeCheck`, `FileCheck`, `KeyRound` (disclosure
  to auditor) are the core semantic set. The brand mark is a custom SVG, never a
  Lucide icon.

```tsx
// canonical icon usage
<ShieldCheck size={16} strokeWidth={1.5} absoluteStrokeWidth
  className="text-verified" aria-hidden />
```

## Gradient-as-light CSS recipes

The gradient behaves as light, never paint. Concrete, low-intensity recipes:

```css
/* Page ambient: depth behind the dark canvas, not a visible blob */
body { background:
  radial-gradient(60rem 40rem at 15% -10%, rgba(99,102,241,0.06), transparent 60%),
  radial-gradient(50rem 36rem at 100% 0%, rgba(16,185,129,0.04), transparent 60%),
  var(--surface-base);
  background-attachment: fixed;
}

/* Hero lead-number wash: the one figure that glows */
.figure-hero { background: linear-gradient(135deg,#818CF8,#34D399);
  -webkit-background-clip: text; background-clip: text; color: transparent; }

/* Primary card cluster: faint indigo rim on the top edge (light from above) */
.card-primary { box-shadow: inset 0 1px 0 rgba(255,255,255,0.04),
  inset 0 1px 0 0 rgba(99,102,241,0.18); }

/* Verified glow: small earned light behind the emerald badge */
.badge-verified { box-shadow: 0 0 0 1px rgba(16,185,129,0.40),
  0 0 16px -4px rgba(16,185,129,0.35); background: rgba(16,185,129,0.08); }

/* Focused field: protected + receiving input */
.field:focus-visible { border-color: rgba(99,102,241,0.40);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.18); }
```

Intensities are deliberately low (4-8% washes, -4px to -6px glow spread). If any
of these reads as a colored blob rather than light, it is too strong. The page
ambient is `background-attachment: fixed` so it sits behind scrolling content as a
stable light source. All of it collapses gracefully: with backgrounds disabled or
`prefers-contrast: more`, surfaces fall back to flat `--surface-*` steps.

## Masked / disclosed amount component (rendering contract)

- **Masked:** a `rounded-md` chip at `bg-surface-3` with a `border-hairline`,
  width matching a 6-figure amount so rows do not reflow on reveal, a small
  indigo dot or left rule as the protected cue. Not text, not asterisks: an empty
  designed chip.
- **Disclosed:** chip content cross-fades to the tabular Geist Mono figure over
  `--dur-base` (240ms) with a brief indigo-to-emerald sweep on the chip border;
  gated on `prefers-reduced-motion` (instant swap). The reveal is logged in the
  product as a deliberate act, mirrored visually by the one-time motion.

## Data-viz specifics

Use a lightweight SVG charting layer (Recharts or visx), themed to the tokens: one
neutral series at `fg-subtle`, at most one accent line at `brand` or `verified`,
no area-fill gradients, 1.5px line weight, tabular-nums on axis labels and
tooltips, `border-hairline` gridlines at low opacity. Default to a table; reach
for a chart only when trend-over-time genuinely beats a column of figures.

---

## Related
- [logo-directions.md](./logo-directions.md)
- [color-system.md](./color-system.md)
- [typography.md](./typography.md)
- [brand-applications.md](./brand-applications.md)
- [../strategy/INDEX.md](../strategy/INDEX.md)
- [../discover/mood-board-direction.md](../discover/mood-board-direction.md)
