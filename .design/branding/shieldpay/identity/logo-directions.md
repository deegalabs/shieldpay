# Logo Directions

> Phase: identity | Brand: ShieldPay | Generated: 2026-06-27

---

This is an evolution of the existing mark, not a redraw. We keep the equity: a
shield silhouette carrying the indigo to emerald gradient (protected, then
proven), and the ShieldPay wordmark set in Inter, semibold, tight tracking. What
changes is how the protection reads. Today the check sits on top of the shield as
a positive stroke. The Guardian/Steward brand and the masked to verified to
disclosed signature ask for something more exact: the protection should be cut
into the shield, not painted onto it. Below are three directions, lead first.

## Direction A: Negative-space privacy slit (recommended lead)

**Concept.** A solid shield carrying the 135deg indigo to emerald gradient, with
the check cut out of it as negative space. The check is not drawn; it is the
absence in the shield, a clean slit through which the surface behind shows. The
shield holds the figure; the slit is the controlled opening through which a proof
passes.

**Strategic rationale.** This is the masked to verified to disclosed motif
compressed into a single glyph. The shield is the mask (the amount held inside,
private by default). The slit is the deliberate, scoped disclosure: a small,
exact opening cut on purpose, never a hole torn open. The gradient running
through it is protected becoming proven. It expresses the Guardian (containment,
depth) and the Steward (a precise, intentional cut, not a flourish) at once. No
competitor owns a privacy-slit shield; a positive checkmark shield is generic
security iconography. Cutting the check turns a category cliche into something
ownable.

**Variations.**
- Primary lockup: gradient shield with slit, set in an `h-8 w-8` tile at
  `bg-brand/10`, next to "ShieldPay" in Inter semibold, tight tracking. The tile
  wash and the shield share the same indigo, so the mark sits in its own field of
  light rather than floating.
- Icon (app/favicon/avatar): the gradient shield with slit alone, no wordmark,
  on `surface-1` or on the brand wash tile. This is the form that must survive at
  16px.
- Monochrome: shield filled in a single `fg-default` ink with the slit cut as the
  page/surface color showing through. Used in the PDF court receipt header, on
  light export surfaces, and anywhere the gradient cannot render (fax-grade
  fallback, embossing, single-color print).
- Gradient-as-light treatment: in hero and large-format spots, the shield can
  carry the gradient as a soft dimensional wash with a faint indigo rim on its
  upper edge, matching the surface-edge light language of the system. The slit
  stays crisp; only the fill breathes.

**Usage rules.** The slit is the brand; never fill it, never add a second stroke
inside it, never let a background pattern show busy textures through it (it reads
against calm surfaces only). Gradient direction is always 135deg. Do not rotate,
outline, or add a drop shadow to the mark. Keep the lucide ShieldCheck reserved
for functional verified badges in the product, so the brand mark and the
status icon never compete. Minimum size and clear-space are set in execution.

## Direction B: Layered-aperture shield (the held secret)

**Concept.** The shield keeps a thin gradient outline (close to today's mark) but
gains an inner shield plane set one elevation step deeper, with the check cut as a
slit in that inner plane. The mark reads as two layers of darkness containing a
single opening, echoing the 5-step surface ramp.

**Strategic rationale.** This makes the depth-and-containment idea literal: the
secret is held behind layered surfaces, and the disclosure happens through one
controlled aperture. It ties the mark directly to the elevation system (the depth
engine) rather than only to the gradient. Strong for product chrome where the
layered-surface language is already on screen. Weaker at very small sizes, where
two planes collapse; that is why it is the secondary, not the lead.

**Variations.** Same four as Direction A, but the monochrome and 16px forms drop
the inner plane and fall back to the single-layer slit shield (Direction A's
glyph), so the family stays coherent across sizes.

**Usage rules.** Use the two-plane form only at 32px and above. Below that, switch
to the single-plane slit. Never show more than one inner aperture.

## Direction C: Evolved positive mark (conservative fallback)

**Concept.** The current mark, refined: same shield outline and positive check,
but the check redrawn as a cleaner, more exact geometry and the gradient
recalibrated to the 135deg light language, with the optional faint top-edge rim.
No negative space.

**Strategic rationale.** Lowest-risk path that preserves every scrap of existing
equity and reads instantly as security. The honest trade-off: a positive-check
shield is the most common security glyph in the category, so it differentiates
the least and does not carry the masked to disclosed signature. Hold this as the
fallback if the slit proves too fragile in real rendering tests, not as the
ambition.

**Variations / usage.** As today's mark, with the gradient angle fixed at 135deg
and the lucide ShieldCheck kept separate for functional badges.

## Recommendation

Lead with **Direction A**. It carries the signature motif in the glyph itself,
differentiates in a crowded security-icon space, and survives to 16px as a single
plane. Use Direction B for large product/marketing chrome where depth can breathe,
and keep Direction C documented as the safe fallback. In all three, the wordmark
stays Inter semibold with tight tracking, and the gradient stays indigo to
emerald at 135deg.

---

## Construction geometry (execution layer, Direction A)

Drawn on a **24x24 viewBox** (the current `brand-mark.tsx` box), so the evolved
mark is a drop-in. A 1px safety margin keeps the shield off the edges.

- **Shield silhouette.** Symmetric about the vertical centerline (x=12). Top edge
  spans x=4 to x=20 at y=3; sides drop straight to y=10, then curve inward to a
  rounded point at (12, 21.5). Corner radius ~1.5 on the shoulders, ~1 at the tip.
  This is a fuller, calmer shield than a heraldic spike: containment, not alarm.
- **The slit (the cut check).** A checkmark removed from the fill as an even-odd
  negative path: short arm from (8.5, 12) to (11, 14.5), long arm from (11, 14.5)
  to (16, 9). Stroke-equivalent width ~1.8 (the cut reads as a 1.8px channel),
  round caps and the inner join mitred clean. The slit is geometry subtracted from
  the shield via `fill-rule="evenodd"`, not a painted stroke, so the surface
  behind shows through it.
- **Gradient.** `linearGradient` at 135deg, `#6366F1` at 0% to `#10B981` at 100%,
  applied as the shield `fill`. Optional hero variant adds a 1px inner top-edge
  highlight at `rgba(255,255,255,0.08)` on the shoulder curve only.

```
defs: linearGradient id="sp-grad" x1=0 y1=0 x2=24 y2=24
        stop 0% #6366F1 · stop 100% #10B981
path  d="<shield outline> <check sub-path>" fill="url(#sp-grad)" fill-rule="evenodd"
```

## Variation specs

| Variation | Form | Color | Min context |
| --- | --- | --- | --- |
| Primary lockup | mark in `h-8 w-8` `bg-brand/10` tile + wordmark | gradient fill | nav, sidebar, headers |
| Icon | mark alone, no tile | gradient on dark, or in brand-wash tile | favicon, avatar, 16px |
| Monochrome | shield in `fg-default`, slit = surface showing | single ink | PDF receipt, 1-color print |
| Hero / light | gradient fill + top-edge rim, soft dimensional wash | gradient + 8% highlight | landing, large format |

## Clear space and minimum size

- **Clear space.** Keep clear space equal to the shield's shoulder width (about
  1/4 of the mark height, ~the height of the tile padding) on all sides of the
  icon, and the cap-height of "ShieldPay" around the full lockup. Nothing,
  including the gradient ambient glow of a neighboring card, intrudes.
- **Minimum size.** Icon: **16px** (favicon floor; below this the slit closes, so
  use the monochrome single-plane form or thicken the slit channel to 2px).
  Primary lockup: **wordmark at 14px** (mark scales to ~20px beside it). Direction
  B's two-plane form has a **32px** floor and falls back to A below that.
- **Favicon.** Ship a 32px and 16px raster cut from Direction A; at 16px verify the
  slit holds a minimum 1px of open channel against the favicon background.

## Don'ts (geometry)

Never fill the slit, never add a second internal stroke, never rotate the mark,
never change the 135deg gradient angle, never apply a drop shadow (the mark uses
light, not shadow, like the rest of the system), never place the gradient mark on
a busy or light-textured field where the slit loses contrast. Keep lucide
`ShieldCheck` for functional badges so identity and status never collide.

---

## Related
- [color-system.md](./color-system.md)
- [typography.md](./typography.md)
- [imagery-style.md](./imagery-style.md)
- [brand-applications.md](./brand-applications.md)
- [../strategy/INDEX.md](../strategy/INDEX.md)
- [../discover/mood-board-direction.md](../discover/mood-board-direction.md)
