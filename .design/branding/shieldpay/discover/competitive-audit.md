# Competitive Audit

> Phase: discover | Brand: ShieldPay | Generated: 2026-06-27

---

Eight references mapped on two axes, then dissected for the concrete surface /
elevation / type / motion specifics ShieldPay can translate into tokens.

## Positioning map

Axes: **Conservative ↔ Progressive** (how far the visual language pushes) and
**Traditional ↔ Modern** (how contemporary the craft reads).

```
                 MODERN
                   |
        Linear     |     Vercel
          ·        |       ·
   Mercury ·       |   · Coinbase
                   |   · Ramp
  Stripe ·         |
 ------------------+------------------
 CONSERVATIVE      |      PROGRESSIVE
                   |
   QuickBooks ·    |
                   |   · Deel
                   |
               TRADITIONAL
```

- **Modern + Conservative (Mercury, Stripe, Linear):** contemporary craft,
  restrained expression. The quadrant ShieldPay should live in.
- **Modern + Progressive (Coinbase, Ramp, Vercel):** contemporary, more
  expressive accent/gradient use.
- **Traditional + Conservative (QuickBooks):** legitimacy, low craft.
- **Traditional + Progressive (Deel):** warm, illustrated, friendly.

ShieldPay belongs just inside Modern + Conservative, leaning toward Mercury,
with one Progressive thread: the indigo→emerald gradient and masked-amount
motif as its expressive signature.

## Per-competitor visual-language analysis

**Mercury (closest sibling, the template).**
- Surfaces: canvas `#171721` (violet-tinted near-black), elevated `#1e1e2a`,
  hairline border `#272735`. Depth comes from *color/opacity shifts, not
  shadows* (explicit rule).
- Text tiers: ink `#ededf3` → subdued `#c3c3cc` → disabled `#70707d`. Note the
  mid tier ShieldPay is missing.
- Accent: single indigo `#5266eb`, hover `#4354c8`, active `#3442a6`. Reserved
  strictly for primary CTA "like indicator lights on a console."
- Type: body weight 420 (between regular and medium); scale 12→65px. Radius 4px
  workhorse, 32px pills.
- Lesson: ShieldPay's `#6366F1` indigo is one notch off Mercury's `#5266eb`;
  the calm is already aligned. Steal the violet-tinted near-black base, the
  surface-shift elevation, and the mid text tier.

**Linear (craft + system benchmark).**
- Built theme generation on **LCH** (perceptually uniform) from base + accent +
  contrast variables, replacing ~98 per-theme variables. Elevation via
  *lighter surfaces*, four levels: background, foreground, panels, dialogs/
  modals.
- Deliberately *limited how much chrome (their accent) bleeds into neutrals* for
  a "more neutral, timeless" ramp. Increased text contrast (lighter text in
  dark mode).
- Type: Inter Display for headings, Inter for body.
- Lesson: keep neutrals nearly neutral, push the accent out of the ramp. Add
  Inter Display for headings to introduce the missing display tier.

**Stripe (table + hierarchy authority).**
- Tabular figures via `tnum` on every numeric/money cell as a "quiet
  financial-data signal." Reference-grade currency and status cells; filter
  chips make the active view obvious. Dashboard leads with 3-4 primary numbers.
- Type indigo `#533afd`, Söhne, deep type-weight hierarchy.
- Lesson: tabular `tnum` everywhere, lead the dashboard with one big number,
  status-cell craft for the verified badge.

**Ramp (dense data, kept light).**
- Tier discipline + alignment make density feel light. Tabular figures by
  default so discrepancies pop. Row heights ~48-56px standard, 40-44px compact.
  Custom typeface (Lausanne) runs 64px hero → 13px caption; weights 100-900 give
  fine hierarchy.
- Lesson: define explicit row-density tokens and a captions tier; commit to
  tabular alignment for the audit table.

**Coinbase (crypto made calm).**
- Layered dark surfaces by progressively lighter grays: Gray0 base → Gray5
  (elev 1) → Gray10 (elev 2) → Gray15 → Gray20. Elevation *without shadows*.
  Text three-tier: Gray100 / Gray60 / inverse. Single accent Blue70 (`#0052ff`)
  for fg/bg/line primary, with Blue0 wash + Blue20 subtle line. WCAG AA, 4.5:1.
- Lesson: the exact surface-lightness ramp model ShieldPay needs, plus the
  "accent has a wash + a line variant" discipline for using indigo dimensionally
  rather than flat.

**Deel (category competitor, the warmth foil).**
- Warm, illustrated, onboarding-rich, friendly; light-mode default; color-coded
  cards. Wins on approachability and worker payslip UX.
- Lesson: ShieldPay's counter is *quiet seriousness*, not warmth. Match Deel's
  worker-payslip clarity but with finance-grade restraint, not illustration.

**Vercel / Geist (motion + token rigor).**
- Motion tokens: instant 100ms, fast 160ms, base 240ms, slow 360ms; state
  changes ~150ms, popovers 200ms, overlays/modals 300ms; physical easing
  `cubic-bezier(0.175, 0.885, 0.32, 1.1)`; spring configs (damping ~200);
  honors `prefers-reduced-motion`.
- Lesson: adopt these durations/easings wholesale for the payroll stepper and
  confirm-motion. No need to invent a motion language; this is the spec.

**QuickBooks (legitimacy floor).**
- Conventional accounting UI; trades craft for familiarity and report density.
- Lesson: borrow only the report-density and exact-figure expectations for the
  auditor portal; do not borrow the dated aesthetic.

## The white space ShieldPay should own

No reference combines all four of these at once, and ShieldPay can:

1. **Mercury-grade calm depth** (surface-lightness elevation, violet-tinted
   near-black) applied to an actual on-chain payroll product.
2. **A confidentiality visual language** nobody owns: a "masked then revealed"
   treatment for amounts (redacted figure → selective disclosure to auditor).
   This is the un-generic signature, the design analog of the privacy strategy.
3. **The indigo→emerald gradient as a meaning carrier** ("protected, then
   proven"), used as dimensional light, not a 2019 text fill. Competitors use a
   single static accent; ShieldPay's two-stop gradient encodes the product's
   core promise.
4. **Stripe/Ramp tabular precision** wired to a verified-proof badge, giving the
   auditor QuickBooks legitimacy with premium-fintech craft.

The defensible position: the *only* confidential payroll tool that reads like
Mercury, proves like Coinbase, and aligns numbers like Stripe, with a privacy
motif none of them have.

---

## Related
- [market-landscape.md](./market-landscape.md)
- [trend-analysis.md](./trend-analysis.md)
- [mood-board-direction.md](./mood-board-direction.md)
- [INDEX.md](./INDEX.md)
