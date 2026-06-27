# Identity
> Phase: identity | Brand: ShieldPay | Generated: 2026-06-27

---

The visual identity for ShieldPay, confidential payroll on Stellar. This is an
evolution, not a rebrand: it preserves the equity (indigo to emerald gradient,
slate dark palette, Inter, the shield-check mark, the verified-emerald badge, the
cryptography-is-invisible principle, and the semantic-token architecture) and
evolves each into a system with depth, precision, and one disciplined motion.

Every decision traces to the strategy: archetype Guardian/Steward, category
"provable privacy," essence "Private, and provable," and the intensity dials
(Boldness 2, Density 4, Precision 5, Motion 2, Warmth 2, Ornamentation 1,
Contrast 4, Saturation 2). The signature is the masked to verified to disclosed
sequence, made real end to end.

## Lookup table

| Chunk | What it answers | Key output |
| --- | --- | --- |
| [logo-directions.md](./logo-directions.md) | How the mark evolves | 3 directions; lead is the negative-space privacy-slit shield carrying the 135deg gradient. Wordmark stays Inter. |
| [color-system.md](./color-system.md) | The palette and its roles | Neutral + Single Accent (gradient as one signal). 5-step lightness elevation ramp, 2 borders, 4-rung fg tiers, indigo/emerald with wash+line, amber/red functional-only, gradient-as-light usage, token mapping. |
| [typography.md](./typography.md) | The type system | Inter (~450 body) + Inter Display (headings) + Geist Mono (figures/hashes/IDs, JetBrains Mono fallback). 4-rung color hierarchy, tabular-nums and right-aligned currency discipline, dense-but-legible scale direction. |
| [imagery-style.md](./imagery-style.md) | The visual register | Gradient-as-light as the only ornament. No stock photos, no crypto cliches, no illustration. Lucide 1.5-stroke icons, the masked/verified/disclosed states and the slit as recurring devices, data-viz restraint. |
| [brand-applications.md](./brand-applications.md) | The brand in context | The three portals (CFO/worker/auditor), the payroll stepper, verified badge, the masked->verified->disclosed component, the PDF receipt header, the landing hero. |

## The identity in one screen

- **Logo lead:** negative-space privacy-slit shield. The check is cut out of the
  gradient shield, turning a generic security glyph into the masked-to-disclosed
  signature. Wordmark stays Inter semibold, tight tracking.
- **Palette spine:** Neutral + Single Accent. Five surfaces
  `#0B1120 / #0F172A / #1A2235 / #1E293B / #232E45`, borders `#1F2A3C / #2C3A52`,
  four fg tiers (0.98 / 0.86 / 0.66 / 0.45), accent = indigo `#6366F1` (protected)
  to emerald `#10B981` (proven) as one signal, amber/red functional-only,
  elevation by lightness + 1px top-edge highlight, not shadow. Dark-mode-only.
- **Type stack:** Inter ~450 body, Inter Display headings, Geist Mono for every
  amount/hash/ID with tabular numerals and right-aligned currency.
- **Signature motif:** masked to verified to disclosed, a first-class three-state
  pattern echoed in the shield slit, the stepper (indigo to emerald), and the
  amount component. Protected, then proven.

## Execution layer (enriched, in-file)

Each chunk now carries its technical layer below the creative rationale:
- **color-system.md** + [palettes.json](./palettes.json): 11-stop OKLCH scales, a
  measured WCAG contrast audit (text tiers and accents vs all 5 surfaces), and the
  CSS token values. Rule from the math: indigo-500 is UI/border-only, indigo-400
  carries indigo text on dark.
- **typography.md:** minor-third scale (base 16px), fluid clamps, weight map,
  line-heights/tracking per level, the tabular-figure CSS contract, and next/font
  loading for Inter + Inter Display + Geist Mono.
- **logo-directions.md:** 24x24 construction geometry for the privacy-slit shield
  (even-odd cut), variation specs, clear space, and the 16px minimum.
- **imagery-style.md:** Lucide icon system (1.5 stroke, size/color/container),
  gradient-as-light CSS recipes, the masked/disclosed component contract, data-viz
  specifics.

Still computed in the next phase: spacing/radius scale, motion token values, and
the component specs. Those belong to guidelines (the design system).

## Inputs this phase used

- ../strategy/: archetype, positioning, brand-platform (dials), voice-and-tone
- ../discover/mood-board-direction.md (token-level moves, already validated)
- The current brand inventory: components/ui/brand-mark.tsx and the existing
  3-surface token system being evolved

---

## Related
- [../strategy/INDEX.md](../strategy/INDEX.md)
- [../discover/mood-board-direction.md](../discover/mood-board-direction.md)
- [../BRIEF.md](../BRIEF.md)
