# Data Table (dense, finance-grade)

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27
> Tier 3 custom component. The product's primary reading surface.

The dense table is where ShieldPay does most of its work: payment history, the
audit view, provider lists. Density 7 means dense-but-legible. A well-set table
beats a chart here; reach for a chart only when trend-over-time genuinely wins.

## Anatomy

- **Header row:** `surface-2` fill, `border-hairline` bottom, labels in `overline`
  (12px, 550, +0.06em, uppercase) at `fg-subtle`.
- **Body rows:** 52px standard height, 44px compact. `border-hairline` between
  rows. Text at `body-sm` (14px) in `fg-strong`; secondary cells `fg-subtle`.
- **Currency column:** right-aligned, Geist Mono, `tabular-nums`, so decimals stack
  and magnitudes scan down the column. Format exactly: `$500.00 USDC`.
- **Verified column:** the `badge-verified` or the masked/verified/disclosed amount
  state, not raw text.
- **ID / hash cells:** Geist Mono, `tabular-nums`, truncated with a copy affordance;
  full value `Proof ID 789`, `ledger 58,204,113`.
- **Row action:** a single lucide icon (16px, `fg-subtle`, brighten on hover), not
  a cluster.

## States

| State | Treatment |
| --- | --- |
| Default | `surface-1` (or transparent over canvas), hairline dividers |
| Hover | row to `surface-3` (alpha-step), action icon to `fg-strong` |
| Selected | `surface-3` + 2px inset indigo left rule (`brand`) |
| Active focus (keyboard) | indigo focus ring on the row |
| Loading | skeleton rows at `surface-2`, no spinner |
| Empty | calm empty state, a single 20px glyph, one line of `fg-subtle` copy |

## Usage

- Default the amount column to the masked or verified state. Disclose only for an
  authorized auditor or the worker's own pay (see `amount-disclosure.md`).
- Keep icons scarce. A dense audit table needs fewer icons, not more.
- Use 44px compact rows when the table is the whole screen (audit export view);
  52px when it sits among cards.
- Right-align every numeric column. Left-align text, dates as `body-sm` mono with
  `tabular-nums`.
- Column headers are `fg-subtle`, not `fg-strong`; the data is the focus.

## Accessibility

- Real `<table>` with `<th scope="col">`. Sort controls are buttons with
  `aria-sort`.
- Status is conveyed by the badge text ("Verified on-chain"), never by color alone.
- Selected row uses `aria-selected`; the indigo rule is supplementary.
- Ensure `fg-subtle` (0.66) clears AA on `surface-2` header (7.63:1, it does);
  never set essential cell values in `fg-faint`.
- Keyboard: rows focusable in order, action reachable, focus ring visible.

## Code hints

```tsx
<table className="w-full border-collapse">
  <thead>
    <tr className="bg-surface-2">
      <th scope="col" className="text-left text-overline text-fg-subtle px-4 py-2">Provider</th>
      <th scope="col" className="text-left text-overline text-fg-subtle px-4 py-2">Reference</th>
      <th scope="col" className="text-right text-overline text-fg-subtle px-4 py-2">Amount</th>
      <th scope="col" className="text-left text-overline text-fg-subtle px-4 py-2">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr className="row-dense" data-selected={selected}>
      <td className="px-4 text-fg-strong text-sm">Jane Doe</td>
      <td className="px-4 text-fg-subtle text-sm">May 2026</td>
      <td className="amount px-4">$500.00 USDC</td>            {/* mono, tabular, right */}
      <td className="px-4"><span className="badge-verified">
        <ShieldCheck size={14} strokeWidth={1.5} aria-hidden /> Verified on-chain
      </span></td>
    </tr>
  </tbody>
</table>
```

`.row-dense` and `.amount` come from `token-mapping.md` (`@layer components`).
Tokens: `surface-2`, `surface-3`, `border`, `brand`, `fg-strong/subtle`, `overline`.
Related: `amount-disclosure.md`, `verified-badge.md`.
