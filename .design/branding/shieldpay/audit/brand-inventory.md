# Brand Inventory

> Phase: audit | Brand: ShieldPay | Generated: 2026-06-27

---

A factual catalog of every brand asset shipping in the ShieldPay codebase today.
Hex values are derived from the HSL tokens in `app/globals.css` and confirmed
against the reference column in `docs/brand/IDENTITY.md`.

## 1. Brand mark

`components/ui/brand-mark.tsx` — a 24x24 inline SVG. A shield outline with a
checkmark inside, both strokes painted with a single `linearGradient`
(`#6366F1` indigo at 0% to `#10B981` emerald at 100%, drawn diagonally across
the icon box). Shield stroke 1.6, check stroke 1.8, round joins/caps. No fill.
The lockup wraps the mark in an `h-8 w-8` tile with `bg-brand/10` and sets the
wordmark "ShieldPay" in `font-semibold tracking-tight` (Inter). Used in four
spots: landing nav, sidebar, mobile topbar, and (per IDENTITY.md) the PDF
receipt header. Lucide `ShieldCheck` is reserved for functional badges.

Recognition note: the mark is the only place the gradient appears as line art
rather than as text fill or ambient glow.

## 2. Color tokens (the architecture)

HSL triplets stored as CSS variables under `:root`, exposed as semantic Tailwind
colors via `hsl(var(--x) / <alpha-value>)`. This indirection is the system's
real strength: components never touch hex.

| Token | HSL | Hex (ref) | Role |
| --- | --- | --- | --- |
| `background` | `222 47% 7%` | `#0A0F1E` | App background, deepest slate |
| `surface` | `222 39% 10%` | `#0F1626` | Cards, panels |
| `surface-2` | `221 33% 14%` | `#18202F` | Raised/nested rows |
| `foreground` | `210 40% 98%` | `#F8FAFC` | Primary text |
| `muted` | `215 18% 62%` | `#8C97A8` | Secondary text |
| `border` | `215 25% 20%` | `#2A3343` | Hairlines |
| `ring` | `243 75% 63%` | `#6366F1` | Focus ring (indigo) |
| `primary` | `158 64% 42%` | `#10B981` | Action, success, "verified" (emerald) |
| `primary-foreground` | `160 84% 6%` | `#022C22` | Text on emerald |
| `brand` | `243 75% 63%` | `#6366F1` | Identity, logo, accents (indigo) |
| `accent` | `243 75% 63%` | `#6366F1` | Alias of brand |
| `warning` | `38 92% 50%` | `#F59E0B` | Amber, functional only |
| `danger` | `0 84% 60%` | `#EF4444` | Red, functional only |

Observations on the architecture itself:
- Only **three** surface steps exist (`background`, `surface`, `surface-2`).
  There is no `surface-3`, no hover-tint token, no dedicated overlay/popover
  token. Elevation is carried almost entirely by `border`, not by light.
- `accent` is a literal duplicate of `brand`. No semantic separation.
- There is no `foreground-subtle` between `foreground` (98%) and `muted` (62%):
  a 36-point lightness cliff with nothing in between, so secondary hierarchy has
  only one rung.

## 3. Typography

- **Family:** Inter, loaded via `next/font/google` in `app/layout.tsx` as
  `--font-inter`, mapped to `font-sans`. A single typeface for everything.
- **Mono stack:** `ui-monospace, 'SF Mono', monospace` as `--font-mono` /
  `font-mono`. Intended for amounts, hashes, proof IDs ("mono = verifiable
  figure"). No custom mono is loaded; it falls back to the OS.
- **Headings:** `h1-h3` get `tracking-tight` globally. Landing hero is
  `text-5xl/6xl font-bold`. Card titles `text-lg font-semibold`.
- **Tabular figures:** named as an "optional upgrade" in IDENTITY.md, **not yet
  applied**. Amount columns do not align today.

## 4. The gradient motif

`bg-gradient-to-r from-brand to-primary` (indigo to emerald), meaning "protected,
then proven." It appears as:
- the brand mark strokes,
- the landing hero headline fill (`bg-clip-text text-transparent`),
- two faint ambient radial glows on `body` (`brand/0.10` and `primary/0.06`),
  fixed-attachment, top corners only.

It is the single most distinctive equity the brand owns.

## 5. Components and depth tokens

- `shadow-card` (very soft, near-flat), `shadow-elevated` (defined, barely used),
  `shadow-glow` (indigo-tinted, defined, essentially unused in surfaces).
- Radius scale anchored at `--radius: 0.75rem` with sm/md/lg/xl/2xl derivations.
- Buttons: 7 variants (primary, brand, ghost, outline, subtle, danger, link), 4
  sizes. Hover is a `brightness-110` shift, no transform. Calm but inert.
- Badge: 5 ring-inset tinted variants at `/12` fill, `/20` ring. The "verified"
  emerald badge is the system's signature status chip.
- Motion: a single `fade-in` keyframe (0.3s, 4px rise), applied to `main`. No
  motion library, no stepper animation, no `prefers-reduced-motion` gate in code.

## 6. Messaging and positioning

- Tagline in `layout.tsx` metadata still reads the legacy line: "Pay anyone in
  the world. Prove mathematically that you paid. Protect your company forever."
- Landing hero: "Pay your team. Keep the amounts private." (current positioning).
- Pillars: Global USDC payouts, Private by default, Selective disclosure.
- Archetype (IDENTITY.md): Guardian with a Steward streak. Three words:
  trustworthy, discreet, exact. Golden rule: cryptography is invisible.
- **Inconsistency:** the metadata tagline and the landing headline tell two
  different stories (legal-proof framing vs confidential-payroll framing).

---

## Related
- [coherence-assessment.md](./coherence-assessment.md)
- [equity-analysis.md](./equity-analysis.md)
- [evolution-map.md](./evolution-map.md)
- [INDEX.md](./INDEX.md)
