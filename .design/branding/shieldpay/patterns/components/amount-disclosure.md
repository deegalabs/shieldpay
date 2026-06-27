# Amount Disclosure (masked -> verified -> disclosed)

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27
> Tier 3 custom component. The signature pattern of the brand.

The three-state amount control. It is how ShieldPay shows that a value is private
by default, provably correct, and disclosed only on authority. It appears wherever
a sensitive amount lives: dashboard figures, table cells, receipts, the auditor view.

## Anatomy

- **Container:** fixed-width slot sized for a six-figure amount (`$000,000.00 USDC`)
  so the row never reflows when the state changes.
- **Masked chip:** `rounded-md` chip at `bg-surface-3` with a `border-hairline`,
  full slot width. A small indigo dot (or 2px left rule) at the leading edge is the
  protected cue. Empty of text. Not asterisks, not a blur, not a redaction bar.
- **Verified state:** the emerald `badge-verified` (lucide `ShieldCheck` + label)
  plus a tabular `Proof ID 789` in Geist Mono. The amount is still not shown; what
  is shown is that it checked out.
- **Disclosed state:** the real figure in Geist Mono, `tabular-nums`, right-aligned
  in tables. `fg-default`.

## States

| State | Meaning | Visual | Cue |
| --- | --- | --- | --- |
| Masked | private by default | slate chip on `surface-3`, hairline border | indigo dot / left rule |
| Verified | proven correct, amount still private | emerald badge + `Proof ID` | emerald glow |
| Disclosed | revealed to an authorized viewer | real tabular mono figure | brief indigo->emerald border sweep |
| Disabled | no value / not applicable | empty chip, `fg-faint` | none |

Transition masked/verified -> disclosed: content cross-fades over `dur-base`
(240ms) with a one-time indigo to emerald sweep on the chip border (`animation:
reveal, border-sweep`). Under `prefers-reduced-motion`, swap instantly with no sweep.

## Usage

- Default to masked in any context where the viewer is not authorized to see the
  exact amount (company-wide views, shared links, the worker's peers).
- Use verified wherever proof matters more than the number: audit tables, receipt
  summaries, the verified column.
- Disclose only for an authorized auditor or the worker viewing their own pay. The
  reveal is a deliberate, logged act in the product, mirrored by the one-time motion.
- Never partially mask with asterisks. The chip is either masked, verified, or
  disclosed.

## Accessibility

- Masked chip: `aria-label="Amount private"`. It is a state, not a control, unless
  it carries a reveal action; if it does, it is a `button` with
  `aria-label="Reveal amount"` and `aria-expanded`.
- Verified: badge text "Verified on-chain" is real text, not conveyed by color
  alone. Proof ID is selectable text.
- Disclosed figure: ensure `fg-default` clears AA on the surface (it does on all
  five; see color-system.md audit).
- The reveal motion is decorative; gate it on `prefers-reduced-motion`. The state
  change must be announced regardless (e.g. `aria-live="polite"` on disclose).

## Code hints

```tsx
type AmountState = 'masked' | 'verified' | 'disclosed';

// fixed-width slot so rows never reflow
<span className="inline-flex w-[11ch] justify-end">
  {state === 'masked' && (
    <span aria-label="Amount private"
      className="relative w-full rounded-md bg-surface-3 ring-1 ring-inset ring-border h-6
                 before:absolute before:left-1.5 before:top-1/2 before:-translate-y-1/2
                 before:h-1.5 before:w-1.5 before:rounded-full before:bg-brand" />
  )}
  {state === 'verified' && (
    <span className="badge-verified">
      <ShieldCheck size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
      <span className="proof-id">Proof ID {proofId}</span>
    </span>
  )}
  {state === 'disclosed' && (
    <span className="figure animate-reveal text-fg-default">{`$${amount} USDC`}</span>
  )}
</span>
```

Border sweep on disclose: add `animate-border-sweep` to the chip wrapper for one
cycle, then settle on `verified-line`. Tokens: `bg-surface-3`, `ring-border`,
`bg-brand`, `.badge-verified`, `.figure`, `--dur-base`, `--ease-physical`.

Related: `verified-badge.md`, `data-table.md`, the logo slit motif in
`../../identity/logo-directions.md`.
