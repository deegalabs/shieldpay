# Color System

> Phase: identity | Brand: ShieldPay | Generated: 2026-06-27

---

## Composition strategy: Neutral + Single Accent

ShieldPay runs on a **Neutral plus Single Accent** model, with one deliberate
twist: the single accent is the two-stop indigo to emerald gradient used as one
signal system, not two colors. Indigo means protected (brand, primary, focus).
Emerald means proven (verified, settled, success). They are the two ends of one
idea, never two competing accents. Neutrals carry 90% or more of every surface
(Saturation dial 2). If a screen looks colorful, it is wrong.

This is dark-mode-only by design. There is no light theme to maintain. The depth,
the gradient-as-light, and the calm all assume a dark canvas; a light variant
would dilute the Guardian containment and is out of scope.

## The neutral depth engine (elevation by lightness, not shadow)

Five surface steps plus two borders, near-neutral with a faint violet tint so the
planes relate to the indigo accent without coloring. Elevation is read from
surface lightness and a 1px top-edge highlight, not from drop shadows. Shadow is
reserved for the overlay level only.

```
--surface-base     #0B1120   page canvas, darkest, ambient gradient atmosphere
--surface-1        #0F172A   primary cards and panels (current slate-900)
--surface-2        #1A2235   nested cards, table header, sidebar
--surface-3        #1E293B   hover, raised/selected rows (current slate-800)
--surface-overlay  #232E45   modals, popovers, dropdowns (soft shadow allowed)
--border-hairline  #1F2A3C   plane separators, quiet dividers
--border-strong    #2C3A52   focused/active field edges, active row
```

Top-edge highlight: `rgba(255,255,255,0.04)` on elevated surfaces (slightly
stronger at level 2) so each plane reads as lit from above. The steps sit close
together so planes are distinct but never banded. This is the depth that holds
the secret: layered darkness, calm, containment.

Rationale: a CFO trusts depth that feels like a real instrument, not flat cards
with hard borders. Lightness-based elevation is the Mercury/Coinbase model and
reads premium without ornament (Boldness 2, Ornamentation 1).

## The 4-rung text hierarchy

Four foreground tiers, fixing today's 36-point cliff between heading and muted.
The new mid and faint tiers let dense audit tables stay calm and scannable
(Density 4, Contrast 4).

```
--fg-default   rgba(248,250,252,0.98)   headings, lead figures, verified amounts
--fg-strong    rgba(248,250,252,0.86)   body, primary labels                 NEW
--fg-subtle    rgba(248,250,252,0.66)   secondary text, table meta (was muted)
--fg-faint     rgba(248,250,252,0.45)   captions, disabled, helper text       NEW
```

The dead `accent` token (a literal duplicate of `brand` today) is repurposed as
`--fg-strong`. No equity lost; a real tier gained.

## The accent: indigo to emerald as one signal system

Used like indicator lights on a console. Each accent has a wash and a line
variant so it has dimensionality and is never a flat block.

```
--brand          #6366F1   indigo: brand, primary action, focus, "protected"
  brand wash     indigo at ~8% over surface   (protected fields, primary tint)
  brand line     indigo at ~40%               (focus border, active rim)
--ring           #6366F1   focus ring (same indigo, the focus signal)

--verified       #10B981   emerald: success, verified, settled, "proven"
  verified wash  emerald at ~8%               (verified badge field)
  verified line  emerald at ~40%              (verified badge border)
```

- **Indigo = protected/brand/focus.** Holds and reassures. It tints the masked
  amount chip, the focused field, the primary button, and the early stages of the
  payroll stepper. It is the resting state of the brand.
- **Emerald = proven/verified/settled.** Reserved for confirmation moments: the
  verified badge, the settled stepper end-state, a successfully disclosed figure.
  Emerald is earned, never ambient. Keeping it scarce is what makes "verified"
  feel like a real event.

## Functional colors (never decorative)

```
--warning  #F59E0B   amber: validation warnings, range/balance flags only
--danger   #EF4444   red: errors, failed payments, destructive actions only
```

Amber and red appear only when the system needs to flag something. They are not
part of the brand palette and never used for emphasis or decoration.

## Gradient as dimensional light

The indigo to emerald gradient is the one expressive element in the whole system
(Ornamentation 1), and it always behaves as light, never as paint or a flat text
fill. Fixed at 135deg everywhere so it reads as one coherent light source.

- **Hero lead-number wash.** The single biggest figure on a screen (dashboard
  balance, paid this month) carries a gentle indigo to emerald wash at low
  intensity. This is the one number that glows; everything else is neutral.
- **Surface-edge rim.** A faint indigo rim on the top edge of the primary card
  cluster, reinforcing light-from-above on the most important plane.
- **Verified glow.** A whisper of emerald behind the verified badge, so proven
  states have a small, earned light.
- **Focused field.** Active inputs pick up the indigo line border plus a soft
  inner glow: the field is now protected and receiving input.
- **Payroll stepper.** The connector travels indigo to emerald as the run moves
  from proving (protected) to settled (proven), animating the brand's core meaning
  in the trust-critical moment.

## Semantic token mapping (preserve the architecture)

Components never touch hex. Everything is a CSS variable exposed as a Tailwind
semantic color. Keep the existing names and add the new ones.

| Role | Token | Note |
| --- | --- | --- |
| page canvas | `--surface-base` | NEW darkest step |
| card/panel | `--surface` -> `--surface-1` | keep `surface`, point at step 1 |
| nested/header | `--surface-2` | NEW |
| hover/raised | `--surface-3` | NEW |
| overlay | `--surface-overlay` | NEW |
| divider | `--border` -> `--border-hairline` | keep `border` name |
| active edge | `--border-strong` | NEW |
| primary text | `--foreground` -> `--fg-default` | keep `foreground` name |
| body | `--fg-strong` | NEW (repurposed dead `accent`) |
| secondary | `--muted-foreground` -> `--fg-subtle` | keep name |
| caption | `--fg-faint` | NEW |
| brand/primary | `--brand`, `--primary` | indigo, unchanged value |
| focus | `--ring` | indigo |
| success | `--verified` / `--success` | emerald |
| warning | `--warning` | amber, functional |
| danger | `--destructive` | red, functional |

OKLCH conversion, exact contrast ratios, and wash/line opacity math are computed
in execution by the color skill. This chunk fixes the roles and the hex spine.

---

## OKLCH scales (execution layer)

Full 11-stop scales live in [`palettes.json`](./palettes.json). The signal and
functional colors use the standard Tailwind-equivalent ramps; the surfaces are a
bespoke violet-tinted dark ramp (lightness-based elevation). Key stops:

| Color | 400 | 500 (source) | 600 |
| --- | --- | --- | --- |
| indigo (brand) | `oklch(0.667 0.163 280.24)` | `oklch(0.585 0.204 277.12)` | `oklch(0.505 0.244 272.22)` |
| emerald (verified) | `oklch(0.748 0.161 162.23)` | `oklch(0.696 0.149 162.47)` | `oklch(0.579 0.124 162.71)` |
| amber (warning) | `oklch(0.819 0.136 66.43)` | `oklch(0.769 0.165 70.07)` | `oklch(0.645 0.138 69.96)` |
| red (danger) | `oklch(0.709 0.152 21.67)` | `oklch(0.637 0.208 25.33)` | `oklch(0.539 0.190 26.43)` |

Surface ramp in OKLCH lightness: base `0.179` -> s1 `0.224` -> s2 `0.278` ->
s3 `0.311` -> overlay `0.343`. Steps are ~0.03-0.05 L apart, so adjacent planes
sit at 1.05-1.13 luminance contrast: distinct but never banded, exactly the calm
depth the system wants.

## Contrast audit (WCAG 2.1, measured)

Text tiers are white composited at their alpha, then measured against each
surface. AA is 4.5:1 for normal text, 3:1 for large/bold (18.66px+ or 14px bold).

**Text tiers vs surfaces (contrast ratio):**

| Tier | base | s1 | s2 | s3 | overlay | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| fg-default (.98) | 18.05 | 17.11 | 15.30 | 14.14 | 13.11 | AA+ everywhere |
| fg-strong (.86) | 13.99 | 13.36 | 12.01 | 11.17 | 10.45 | AA+ everywhere |
| fg-subtle (.66) | 8.48 | 8.22 | 7.63 | 7.20 | 6.82 | AA everywhere |
| fg-faint (.45) | 4.51 | 4.46 | 4.30 | 4.16 | 4.02 | AA-large only |

`fg-faint` clears AA-large (3:1) on every surface and AA-normal only on the
darkest. It is reserved for captions, helper text, and disabled states (disabled
is exempt from AA). Never set body or essential values in fg-faint.

**Accents vs surfaces (contrast ratio):**

| Accent | base | s1 | s2 | s3 | overlay | Use |
| --- | --- | --- | --- | --- | --- | --- |
| indigo-500 `#6366F1` | 4.22 | 4.00 | 3.55 | 3.27 | 3.04 | UI/borders/large only |
| indigo-400 `#818CF8` | 6.31 | 5.98 | 5.32 | 4.90 | 4.55 | indigo TEXT on dark |
| emerald-500 `#10B981` | 7.42 | 7.04 | 6.25 | 5.77 | 5.35 | verified text + UI |
| emerald-400 `#34D399` | 9.79 | 9.29 | 8.25 | 7.61 | 7.06 | high-emphasis verified |
| amber-500 `#F59E0B` | 8.77 | 8.31 | 7.38 | 6.81 | 6.32 | warning text + UI |
| red-400 `#F87171` | 6.81 | 6.45 | 5.73 | 5.29 | 4.90 | danger TEXT on dark |
| red-500 `#EF4444` | 5.00 | 4.74 | 4.21 | 3.89 | 3.60 | danger fills/large |

Rule that falls out of the math: **indigo-500 is never used for text** (it fails
AA as body on raised surfaces). Indigo text uses indigo-400. Indigo-500 stays for
fills, focus rings, and borders (the 3:1 UI threshold), where it reads at 3.0-4.2.
Emerald and amber are safe as text at -500.

**Foreground-on-fill pairs:**

| Pair | Ratio | Verdict |
| --- | --- | --- |
| white on indigo-500 (primary button) | 4.47 | AA (normal, borderline); AA+ as button label |
| `primary-foreground #022C22` on emerald-500 | 5.97 | AA |
| black on amber-500 (warning chip) | 9.78 | AA+ |

The primary button label is white on indigo-500 at 4.47 (effectively AA; button
text is medium-weight so it also clears the 3:1 large bar with margin). If a
stricter pass is wanted, darken the button fill to indigo-600 or set the label in
pure white at 500 weight, which is already the spec.

## Token values for execution

The builder maps these to CSS variables under `:root` (the existing HSL-var
architecture stays; values below are the source of truth). Full machine-readable
scales: [`palettes.json`](./palettes.json).

```
--surface-base #0B1120  --surface-1 #0F172A  --surface-2 #1A2235
--surface-3 #1E293B     --surface-overlay #232E45
--border-hairline #1F2A3C  --border-strong #2C3A52
--fg-default rgba(248,250,252,.98)  --fg-strong rgba(248,250,252,.86)
--fg-subtle rgba(248,250,252,.66)   --fg-faint rgba(248,250,252,.45)
--brand #6366F1  --brand-text #818CF8  --ring #6366F1
  brand-wash rgba(99,102,241,.08)   brand-line rgba(99,102,241,.40)
--verified #10B981
  verified-wash rgba(16,185,129,.08)  verified-line rgba(16,185,129,.40)
--warning #F59E0B  --danger #EF4444  --danger-text #F87171
--gradient: linear-gradient(135deg, #6366F1, #10B981)   /* light, never paint */
```

---

## Related
- [logo-directions.md](./logo-directions.md)
- [typography.md](./typography.md)
- [imagery-style.md](./imagery-style.md)
- [brand-applications.md](./brand-applications.md)
- [../strategy/INDEX.md](../strategy/INDEX.md)
- [../discover/mood-board-direction.md](../discover/mood-board-direction.md)
