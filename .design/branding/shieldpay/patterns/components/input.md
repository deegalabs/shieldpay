# Input (override)

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27
> Tier 2 override. Captures the indigo focused-field glow.

The text field. The override tokens cannot express: on focus the field picks up an
indigo line border plus a soft inner indigo glow. The meaning is deliberate, the
field is now protected and receiving input. This is the focused-field gradient-as-
light, applied as a contained glow, not a paint.

## Anatomy

- **Field:** `rounded-lg`, `bg-surface-base/60`, `border-hairline`, text in
  `fg-default`, placeholder in `fg-faint`.
- **Label:** above the field, `body-sm` 500 weight, `fg-strong`.
- **Helper / error:** below, `caption` in `fg-faint` (helper) or `danger-text` (error).
- **Amount fields:** use Geist Mono with `tabular-nums`, right-aligned, when entering
  a currency value.

## States

| State | Treatment | Duration |
| --- | --- | --- |
| Default | `surface-base/60`, hairline border | — |
| Hover | border to `border-strong` | `dur-fast` |
| Focus-visible | indigo line border (`brand-line`) + 3px inner indigo glow | `dur-fast` |
| Filled | `fg-default` value | — |
| Disabled | `opacity-50`, `fg-faint`, no glow | instant |
| Error | `danger` line border, `danger-text` message, no indigo glow | `dur-fast` |

## Usage

- The indigo focus glow is the only decorative light on a field. Do not stack it with
  a shadow.
- Currency and identity inputs (amount, address, tax id) render their value in mono
  with `tabular-nums`. Prose inputs stay Inter.
- Placeholder is `fg-faint` and only ever a hint, never load-bearing label text.
- Error states drop the indigo glow entirely; the field is now flagged, not protected.

## Accessibility

- Every input has an associated `<label>`; placeholder is not a substitute.
- Focus glow is supplementary to a visible border change, so focus is clear without
  relying on the glow alone.
- Error messages are linked via `aria-describedby` and use `danger-text` (red-400,
  AA on dark), not red-500, for the message text.
- `fg-faint` placeholders are AA-large only; never put essential instruction there.

## Code hints

```tsx
<label className="text-sm font-medium text-fg-strong" htmlFor="amount">Amount</label>
<input id="amount" className="input figure text-right" inputMode="decimal" placeholder="0.00" />
```

```css
.input {
  background-color: hsl(var(--surface-base) / 0.60);
  border: 1px solid hsl(var(--border));
  color: var(--fg-default);
  transition: border-color var(--dur-fast) var(--ease-physical),
              box-shadow var(--dur-fast) var(--ease-physical);
}
.input::placeholder { color: var(--fg-faint); }
.input:hover { border-color: hsl(var(--border-strong)); }
.input:focus-visible {
  border-color: var(--brand-line);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
}
```

Tokens: `surface-base`, `border`, `border-strong`, `brand-line`, `fg-default/faint`,
`danger`/`danger-text`, `--dur-fast`, `--ease-physical`. Related: `token-mapping.md`,
imagery-style `.field:focus-visible`.
