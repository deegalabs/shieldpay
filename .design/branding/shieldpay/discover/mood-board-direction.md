# Mood Board Direction

> Phase: discover | Brand: ShieldPay | Generated: 2026-06-27

---

Actionable direction for the design system, grounded in the references and tied
to the **Guardian / Steward** essence: protect the sensitive number, keep clean
books, prove without exposing. Every recommendation below is a token-level move.

## Essence anchor

Guardian = depth, containment, calm authority (the dark, layered surfaces that
hold the secret). Steward = precision, legibility, exactness (the tabular
figures and clean tables that keep the books). The gradient is the hinge:
**indigo = protected, emerald = proven.** Indigo holds and reassures; emerald
confirms and settles. Keep them as the two stops of one motif, never two random
accents.

## 1. Neutral slate ramp (the depth engine)

Replace the flat 3-surface system with a 5-step, near-neutral, violet-tinted
ramp (Mercury/Coinbase model: elevation by lightness, not shadow). Keep the
existing slate hue family, push the accent *out* of the neutrals (Linear's
lesson). Suggested dark ramp:

```
--surface-base       #0B1120   /* canvas, darkest, page background        */
--surface-1          #0F172A   /* current slate-900: primary cards/panels */
--surface-2          #1A2235   /* nested cards, table header, sidebar     */
--surface-3          #1E293B   /* current slate-800: hover, raised rows    */
--surface-overlay    #232E45   /* modals, popovers, dropdowns             */
--border-hairline    #1F2A3C   /* plane separators (Mercury #272735 model)*/
--border-strong      #2C3A52   /* focused/active field edges              */
```

Steps are ~4-6 LCH-lightness apart so planes are distinct but never banded. Each
elevated surface gets a 1px top-edge highlight (`rgba(255,255,255,0.04)`) to
read as light-from-above. No drop shadows on dark; reserve shadow only for the
overlay level.

## 2. The indigo→emerald gradient as dimensional light

Stop using the gradient as a flat text fill or noisy corner blob. Re-deploy as
light tied to elevation:

- **Hero figure:** the single lead number (dashboard balance, "paid this month")
  carries a gentle `indigo #6366F1 → emerald #10B981` wash, low intensity. This
  is the one big number Stripe/Mercury lead with.
- **Surface edge light:** a faint indigo rim on the top edge of the primary card
  cluster; a whisper of emerald glow behind the verified badge.
- **Focused field:** active inputs pick up an indigo border + soft inner glow
  (Coinbase's "accent has a wash + a line variant" discipline).
- **Stepper:** the payroll sequence travels indigo→emerald as it moves from
  "proving" (protected) to "settled" (proven), literally animating the meaning.

Gradient angle stays consistent (135deg) so it reads as one coherent light.

## 3. Accent discipline

One accent system, used like Mercury's "indicator lights on a console":

- **Indigo `#6366F1`** = brand, primary action, focus, "protected" state. Give
  it a wash (`indigo/8%` bg) and a line (`indigo/40%` border) variant so it has
  dimensionality, never a flat block.
- **Emerald `#10B981`** = success, verified, settled, "proven" state. Reserved
  for confirmation moments, not general UI.
- **Amber `#F59E0B` / Red `#EF4444`** = warning / danger only. Never decorative.
- Neutrals carry 90%+ of the surface. If a screen looks colorful, it is wrong.

## 4. Typography (Inter + tabular/mono for figures)

- **Body:** Inter, kept. Adopt Mercury's insight and run body at a slightly
  heavier register (Inter 450-ish via weight, or 420 if variable) for that
  premium "set with authority" feel.
- **Headings:** add **Inter Display** for headings (Linear's exact move) to
  create the missing display tier and add expression without a new brand face.
- **Figures:** every amount, hash, proof ID gets `font-variant-numeric:
  tabular-nums` and a mono face (e.g. Geist Mono / JetBrains Mono) for
  hashes/IDs. Right-align currency columns. This delivers the "exact" promise.
- **Text hierarchy (fix the 98%→62% jump):** insert a mid tier.

```
--fg-default   rgba(248,250,252,0.98)   /* headings, key figures   */
--fg-strong    rgba(248,250,252,0.86)   /* body, primary labels    */ NEW
--fg-subtle    rgba(248,250,252,0.66)   /* secondary, table meta   */ (was muted)
--fg-faint     rgba(248,250,252,0.45)   /* captions, disabled      */ NEW
```

Four rungs (Stripe/Ramp model) so dense audit tables stay calm and scannable.
Repurpose the dead `accent` token as `--fg-strong` or a hover surface; no equity
lost.

## 5. Elevation recipe (concrete)

| Level | Surface | Border | Light cue | Use |
|---|---|---|---|---|
| 0 base | `--surface-base` | none | ambient gradient atmosphere | page |
| 1 card | `--surface-1` | hairline | top-edge highlight 4% | panels, cards |
| 2 raised | `--surface-2` | hairline | top-edge highlight 6% | table header, hover |
| 3 active | `--surface-3` | border-strong | indigo rim on focus | selected row, active |
| overlay | `--surface-overlay` | border-strong | soft shadow allowed | modal, popover |

Table rows: 52px standard / 44px compact (Ramp). Verified badge sits at level 2
with the emerald wash + line treatment.

## 6. Motion language (adopt Geist tokens)

```
--ease-physical  cubic-bezier(0.175, 0.885, 0.32, 1.1)
--dur-instant 100ms   --dur-fast 160ms   --dur-base 240ms   --dur-slow 360ms
```

- State changes / hovers: `--dur-fast`, physical ease.
- Popovers / tooltips: `--dur-base`.
- Modals / overlays: `--dur-slow`.
- **Payroll stepper (the trust moment):** discrete stepped sequence,
  sending → proving → verifying → settled. Each stage eases in over `--dur-base`,
  the connector fills indigo→emerald, the final "settled" state lands with a
  subtle emerald confirm. No spinner, no loop. Gate everything on
  `prefers-reduced-motion` (drop to instant state swaps).

## 7. The signature: masked → verified → disclosed

The brand-defining pattern (white space no competitor owns). Design three states
of a sensitive amount as first-class:

1. **Masked (default):** a deliberate slate chip standing in for the figure
   (not asterisks, not a crude blur), with the indigo "protected" cue.
2. **Verified:** emerald badge + tabular proof ID confirming correctness without
   revealing the number.
3. **Disclosed:** for the authorized auditor, the real tabular figure revealed
   with a brief indigo→emerald reveal motion. This is the "auditable on demand"
   promise made visible.

Echo this in the shield mark: keep the silhouette + gradient, cut the check as a
negative-space privacy slit (per the evolution map).

---

## Style Affinity

From `gsp-style/styles/INDEX.yml`, the closest presets:

1. **`modern-dark` (primary).** "Linear/Vercel aesthetic, ambient blobs, mouse
   spotlights." This is the exact target register: dark-first, restrained,
   craft-led, ambient gradient light, the motion lineage we are adopting from
   Geist/Linear. It maps directly to the elevation + ambient-gradient + motion
   recommendations. Use as the base preset.

2. **`minimal-dark` (secondary / tempering).** "Three layers of darkness with
   warm amber accents." Borrow its *layered-darkness elevation discipline*
   (multi-step dark surfaces, restraint) but swap its warm amber accent for our
   indigo→emerald. It keeps `modern-dark` from drifting toward expressive/
   cinematic and reinforces the calm, finance-grade containment of the Guardian
   essence.

3. **`enterprise` (accent reference only).** "Indigo-to-violet gradient,
   dashboard-ready corporate." Validates the indigo-gradient + dashboard-density
   direction and the B2B trust posture, but is too light/corporate to lead. Pull
   its dashboard-table sensibility, not its surface treatment.

**Explicitly reject:** `web3` ("Bitcoin orange on void black"), `cyberpunk`,
`terminal`. These are the hacker aesthetic the brief forbids and the exact thing
ShieldPay's "cryptography is invisible" rule exists to avoid.

**Net:** `modern-dark` for the surface/motion/gradient craft, tempered by
`minimal-dark`'s layered restraint, with `enterprise` informing the data-dense
dashboard. Calm trust preserved; craft, depth, hierarchy, and life added.

---

## Related
- [market-landscape.md](./market-landscape.md)
- [competitive-audit.md](./competitive-audit.md)
- [trend-analysis.md](./trend-analysis.md)
- [INDEX.md](./INDEX.md)
