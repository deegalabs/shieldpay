# Coherence Assessment

> Phase: audit | Brand: ShieldPay | Generated: 2026-06-27

---

Three dimensions, rated 1 (incoherent) to 5 (fully coherent), with the specific
disconnects that drag each score and who they hurt.

## Ratings

| Dimension | Score | One-line verdict |
| --- | --- | --- |
| Strategy coherence | 4 / 5 | The story (private, then provable) is sharp and consistent; one stray legacy tagline. |
| Strategy-to-visual alignment | 2 / 5 | "Finance-grade and calm" landed as flat and lifeless; the visuals say "correct," not "crafted." |
| Internal consistency | 4 / 5 | Token discipline is genuinely good; gaps are omissions, not contradictions. |

## 1. Strategy coherence — 4 / 5

The strategic core is clear and well-documented: Guardian/Steward archetype,
"cryptography is invisible," indigo = protected / emerald = proven. The brief,
IDENTITY.md, and the landing copy all agree on the confidential-payroll story.
The three personas are explicit and the gradient encodes the exact value prop.

The one real crack: the `layout.tsx` metadata still ships the **legacy** tagline
("Prove mathematically that you paid. Protect your company forever") which is the
old court-grade legal-proof framing, while the landing leads with confidential
payroll. A CFO who reads the browser tab and then the hero gets two different
products. Minor, but it is the seam where the repositioning was never finished.

## 2. Strategy-to-visual alignment — 2 / 5

This is the audit's headline problem and it matches the brief's own complaint.
The strategy asked for "calm, premium, finance-grade." The execution delivered
**calm and correct, but flat and lifeless.** Specific disconnects:

- **No elevation system.** Three slate surfaces separated almost entirely by a
  single hairline `border`, with a near-invisible `shadow-card`. Mercury and
  Linear build hierarchy with layered surface light, soft inner highlights, and
  graded shadow. Here every card sits on the same visual plane as the page, so
  the eye has nothing to climb. "Calm" reads as "undifferentiated."

- **One-rung text hierarchy.** `foreground` at 98% jumps straight to `muted` at
  62% with nothing between. Stripe and Ramp run four to five text tiers (title,
  body, secondary, caption, disabled). The CFO scanning a dense payroll table
  cannot get the gentle "this is primary, this is metadata" gradient that makes
  dense data feel calm rather than uniform-gray.

- **Inert interaction.** Buttons shift `brightness` only; the single `fade-in`
  is the entire motion vocabulary. Linear's reputation is built on motion that
  *confirms*. The payroll "sending to proving to verifying to settled" sequence
  the IDENTITY doc describes has no animated stepper in code, so the most
  trust-critical moment in the product is visually silent.

- **The gradient is underused as craft.** It appears as flat text fill and two
  faint corner glows, but never as the dimensional, light-bearing accent
  Coinbase/Stripe use (gradient on a key surface edge, a glowing focused field,
  a hero figure). It signals the brand but does not yet give the UI life.

- **Mono never earns its keep.** The strategy says mono = exact/verifiable, but
  with no tabular figures and amounts not consistently set in mono, the "precise
  machine-checked figure" signal that should reassure the auditor is absent at
  the pixel level.

The net effect for personas: the skeptical CFO sees something tidy but not
obviously premium enough to out-trust Deel; the worker sees a clean but generic
record; the auditor gets correct data without the typographic precision cues
that say "these numbers are exact."

## 3. Internal consistency — 4 / 5

Genuinely strong. Components consume semantic tokens, not raw hex (the
tailwind/globals architecture is enforced). Badge, Button, and Card share radius,
ring, and shadow language. Indigo-for-identity / emerald-for-success role
discipline is observed in the landing and badges.

Points off for omissions that read as unfinished rather than wrong:
- `accent` duplicates `brand` (dead token).
- `shadow-elevated` and `shadow-glow` are defined but effectively unused, so the
  depth vocabulary exists on paper but not on screen.
- The landing feature/step copy uses a literal `|` as a visual separator inside
  prose ("a zero-knowledge proof | the public sees only..."), a small but real
  polish miss in the most-seen surface.

## Key disconnect, named

**Calm but flat: the system has trust without depth.** It earns the "finance-grade"
adjective and then stops one craft-layer short of Mercury/Linear: no elevation,
one text rung, inert motion, and a signature gradient used as decoration rather
than as light. The strategy is right; the surface has not yet been built up to
meet it.

---

## Related
- [brand-inventory.md](./brand-inventory.md)
- [market-fit.md](./market-fit.md)
- [evolution-map.md](./evolution-map.md)
- [INDEX.md](./INDEX.md)
