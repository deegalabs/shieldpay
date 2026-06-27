# ShieldPay — STYLE.md (agent contract)

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27

The operational contract for building ShieldPay UI. Rendered from `shieldpay.yml`.
Source of truth for tokens is `components/token-mapping.md`. The WCAG AA contrast
audit is already measured in `../identity/color-system.md`; do not re-run it.

ShieldPay is dark-mode only. There is no light theme.

---

## Intensity

| Dial | Value | What it means in build |
| --- | --- | --- |
| Variance | 2 | Strict, calm grids. One ornament only (the gradient-as-light). No layout flourish. |
| Motion | 2 | Restrained. Motion confirms or reveals, never decorates. No spinners, no loops. |
| Density | 7 | Dense-but-legible finance tables. 52px standard / 44px compact rows. |

Identity dials behind these: Boldness 2, Density 4, Precision 5, Motion 2,
Warmth 2, Ornamentation 1, Contrast 4, Saturation 2. Net: calm plus high craft,
not flashy. This is modern-dark's craft tempered by minimal-dark's restraint, with
the indigo to emerald signal swapped in for any preset accent.

---

## Philosophy

ShieldPay is a Guardian and Steward. The Guardian gives depth and containment: a
deep, calm, layered dark that holds a secret on purpose. The Steward gives
precision: every figure exact, aligned, and checkable. The positioning is
**provable privacy**, and the whole surface says it in one line, **protected, then
proven.**

Indigo is protected. It tints the masked amount, the focused field, the primary
button, the early stages of a payroll run. It is the resting state of the brand.
Emerald is proven. It is reserved for confirmation: the verified badge, the settled
end-state, a disclosed figure that checked out. Emerald is earned, never ambient.
Keeping it scarce is what makes "verified" feel like a real event.

Cryptography is invisible. The verified state is a designed badge, not a lock
emoji. Copy says "Verified on-chain," not "Groth16." The product reads as a
finance instrument a CFO trusts, not a crypto app.

---

## Patterns

### Surfaces and elevation

| Level | Token | Use | Shadow |
| --- | --- | --- | --- |
| Canvas | `surface-base` `#0B1120` | page background, ambient gradient light | none |
| 1 | `surface` `#0F172A` | cards, panels | top-edge highlight only |
| 2 | `surface-2` `#1A2235` | nested cards, table header, sidebar | top-edge (slightly stronger ~6%) |
| 3 | `surface-3` `#1E293B` | hover, raised/selected rows | none |
| Overlay | `surface-overlay` `#232E45` | modals, popovers, dropdowns | soft drop shadow (the only level that gets one) |

Borders: `border` (hairline `#1F2A3C`) for dividers; `border-strong` `#2C3A52` for
focused or active edges. Elevation is read from lightness plus a 1px top-edge
highlight `rgba(255,255,255,0.04)`, never from drop shadows.

### Foreground tiers

| Tier | Value | Use |
| --- | --- | --- |
| `fg-default` | white 0.98 | headings, lead figures, verified amounts |
| `fg-strong` | white 0.86 | body, primary labels (default body color) |
| `fg-subtle` | white 0.66 | secondary text, table meta, column headers |
| `fg-faint` | white 0.45 | captions, helper, disabled (AA-large only, never body) |

Never introduce a fifth tier. Hierarchy comes from tier plus weight plus the
Inter/mono split, never from coloring text with indigo or emerald.

### Components

| Component | Recipe |
| --- | --- |
| Card | `bg-surface`, `border-border`, `rounded-xl`, top-edge highlight. No drop shadow. Use `.card-primary` (indigo top rim) for the one hero figure cluster. |
| Button primary | `bg-brand` (indigo) fill, white label 500 weight, `rounded-lg`. Hover brightness-110 over `dur-fast`. This is the protected/primary affordance. |
| Button verified | `bg-primary` (emerald) fill, `primary-foreground` ink. Reserved for confirm/settle actions only. |
| Button secondary | `bg-surface-2`, `border-border`, `fg-strong`. Hover to `surface-3` + `border-strong`. |
| Input | `bg-surface-base/60`, `border-border`. Focus: indigo line border + 3px inner indigo glow. Placeholder in `fg-faint`. |
| Badge verified | `verified-wash` fill, `verified-line` ring, emerald glow, lucide `ShieldCheck`, tabular Proof ID. |
| Nav | frosted `surface-1` with `backdrop-blur`, `border-border` bottom. Slit-shield mark in `bg-brand/10` tile + ShieldPay wordmark. |
| Table | header `surface-2`, rows 52px / 44px compact, hover `surface-3`, currency right-aligned and mono, verified-badge column. |
| Modal/popover | `surface-overlay`, `border-strong`, the one drop shadow, opens over `dur-slow`. |

Full per-component specs: `components/*.md`.

---

## Constraints

### Never

- Drop shadows on non-overlay surfaces. Elevation is lightness-based.
- Indigo-500 `#6366F1` as body text. It fails AA on raised surfaces. Indigo text
  uses `brand-text` `#818CF8` (indigo-400).
- The gradient as a flat fill, paint, or text decoration. It is light only.
- Neon, hacker, or cyberpunk aesthetics. No crypto cliches (chains, coins, circuit
  textures, hoodies, 3D blockchains).
- Asterisks or blur for masked amounts. Use the designed slate chip.
- Em-dashes, exclamation marks, or emoji in product copy.
- More than the four foreground tiers.
- Emerald as ambient or decoration. It is earned, confirmation-only.
- A third hue for emphasis.

### Always

- Elevation by lightness plus a 1px top-edge highlight.
- `tabular-nums` plus mono on every amount, hash, proof ID, count, and date.
- Right-align currency columns so decimals stack.
- The gradient behaves as light only: hero wash, card rim, verified glow, focus
  glow, stepper connector.
- Gate all motion on `prefers-reduced-motion` (drop to instant state swaps).
- Reserve emerald for confirmation (verified, settled, disclosed-success).
- Format figures exactly: `$500.00 USDC`, `ledger 58,204,113`, `Proof ID 789`.
- Keep lucide `ShieldCheck` for the functional verified badge. The brand mark is a
  custom negative-space slit-shield SVG, never a Lucide icon.

---

## Effects

Interaction vocabulary: calm, no spotlight, no glow-sweep.

| Effect | Trigger | Treatment | Duration |
| --- | --- | --- | --- |
| border-brighten | hover/active on cards, secondary buttons, rows | `border` to `border-strong` | `dur-fast` 160ms |
| indigo-rim-focus | `:focus-visible` on inputs/fields | indigo line border + 3px inner indigo glow | `dur-fast` |
| alpha-step | row/surface hover | lightness step to `surface-3` | `dur-fast` |
| emerald-confirm | amount verified / stepper settled | one-time emerald settle ring, no loop | `dur-base` 240ms |
| reveal | masked amount disclosed | cross-fade to figure + indigo->emerald border sweep, one-time | `dur-base` |
| popover/tooltip open | open | fade + slight rise | `dur-base` |
| modal open | open | fade + rise, the one drop shadow | `dur-slow` 360ms |

Easing is `--ease-physical` `cubic-bezier(0.175, 0.885, 0.32, 1.1)` everywhere.
Every effect collapses to an instant state swap under `prefers-reduced-motion`.

---

## Bold Bets

The five distinctive moves that make this ShieldPay and not a generic dark
dashboard. Build these deliberately.

1. **The negative-space privacy-slit shield.** The logo is a solid shield carrying
   the 135deg indigo to emerald gradient, with the check cut out as negative space
   (even-odd, 24x24 viewBox). The shield is the mask; the slit is the controlled
   disclosure; the gradient is protected becoming proven. Custom SVG, never a
   Lucide icon. Reserve lucide `ShieldCheck` for the functional verified badge so
   identity and status never compete.

2. **Lightness-based 5-step elevation, no shadows.** Depth is read from surface
   lightness and a 1px top-edge highlight, not from drop shadows. Shadow exists at
   exactly one level: the overlay. This is the Mercury/Coinbase depth that reads
   premium without ornament. Adjacent steps sit at 1.05 to 1.13 luminance contrast:
   distinct, never banded.

3. **The indigo to emerald gradient as dimensional light.** One ornament in the
   whole system. It always behaves as light: the hero lead-number wash, the primary
   card top rim, the emerald verified glow, the focused-field indigo glow, the
   payroll stepper connector. Never paint, never a flat fill, never a text gradient
   used as decoration. Low intensity (4 to 8% washes); if it reads as a colored
   blob, it is too strong.

4. **The masked to verified to disclosed amount.** A first-class three-state amount
   pattern. Masked is a designed slate chip on `surface-3` with a hairline and an
   indigo dot cue, sized for a six-figure amount so rows do not reflow, never
   asterisks or blur. Verified is the emerald badge plus a tabular Proof ID.
   Disclosed is the real tabular Geist Mono figure, cross-faded over `dur-base` with
   a brief indigo to emerald border sweep. See `components/amount-disclosure.md`.

5. **The payroll stepper with an indigo to emerald connector.** The run goes
   sending, proving, verifying, settled as a discrete stepped sequence. Each stage
   eases in over `dur-base`. The connector fills indigo to emerald as the run moves
   from protected to proven. Settled lands with a subtle emerald confirm. No
   spinner, no loop. This animates the brand's core meaning in the trust-critical
   moment. See `components/payroll-stepper.md`.

Supporting bet: **tabular and mono figure discipline.** Every amount, hash, and ID
is Geist Mono with `tabular-nums`; currency right-aligns. This is the cheapest,
clearest credibility win in the product.

---

## Implementation

Concrete recipes. Full paste-ready deltas live in `components/token-mapping.md`.

### Gradient-as-light (the one ornament)

```css
/* Page ambient: depth behind the dark, not a visible blob */
body { background:
  radial-gradient(60rem 40rem at 15% -10%, rgba(99,102,241,0.06), transparent 60%),
  radial-gradient(50rem 36rem at 100% 0%, rgba(16,185,129,0.04), transparent 60%),
  hsl(var(--surface-base));
  background-attachment: fixed;
}
/* Hero lead-number wash: the one figure that glows (clip uses 400 stops for legibility) */
.figure-hero { background: linear-gradient(135deg,#818CF8,#34D399);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
/* Primary card cluster: faint indigo rim on the top edge */
.card-primary { box-shadow: inset 0 1px 0 rgba(255,255,255,0.04),
  inset 0 2px 0 -1px rgba(99,102,241,0.18); }
```

### Elevation top-edge highlight (no drop shadow)

```css
.card    { background: hsl(var(--surface));   box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
.card-2  { background: hsl(var(--surface-2)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }
.surface-overlay { background: hsl(var(--surface-overlay));
  box-shadow: 0 16px 48px -16px rgba(0,0,0,0.65); } /* the only drop shadow */
```

### Figure CSS contract (mandatory on every value)

```css
.figure, td.amount, .proof-id, .hash {
  font-family: var(--font-mono);           /* Geist Mono, JetBrains Mono fallback */
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "ss01" 1;
  font-weight: 480;
}
td.amount { text-align: right; }
```

### Focused-field glow (protected + receiving input)

```css
.input:focus-visible {
  border-color: var(--brand-line);                 /* indigo 40% line */
  box-shadow: 0 0 0 3px rgba(99,102,241,0.18);     /* soft inner indigo glow */
}
```

### Verified badge (earned emerald light)

```css
.badge-verified {
  color: hsl(var(--verified)); background: var(--verified-wash);
  box-shadow: 0 0 0 1px var(--verified-line), 0 0 16px -4px rgba(16,185,129,0.35);
}
```

### Payroll stepper connector (indigo to emerald)

```css
.stepper-connector { background: linear-gradient(90deg, #6366F1 var(--progress,0%), hsl(var(--border)) 0); }
.stepper-step[data-state="settled"] { animation: confirm var(--dur-base) var(--ease-physical); }
@media (prefers-reduced-motion: reduce) {
  .stepper-step { animation: none; }
  .stepper-connector { transition: none; }
}
```

### Motion tokens

```css
--ease-physical: cubic-bezier(0.175, 0.885, 0.32, 1.1);
--dur-instant: 100ms; --dur-fast: 160ms; --dur-base: 240ms; --dur-slow: 360ms;
```

Hover and state changes use `dur-fast`; popovers and tooltips `dur-base`; modals
`dur-slow`. Everything is gated globally on `prefers-reduced-motion`.

---

## Voice

Calm, Precise, Trustworthy. Guardian and Steward.

- Say "Verified on-chain," not "Groth16." Say "Private," not "masked commitment."
- No crypto jargon in product copy. Cryptography is invisible.
- The verified state is a designed badge, not a lock emoji.
- No em-dashes, no exclamation marks, no emoji in product copy.
- Short, exact sentences.
- Format figures exactly: `$500.00 USDC`, `ledger 58,204,113`, `Proof ID 789`.

Hero headline: **Private payroll you can prove.**
Motif line: **Protected, then proven.**
