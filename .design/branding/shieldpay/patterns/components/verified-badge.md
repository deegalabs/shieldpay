# Verified Badge

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27
> Tier 3 custom component. The earned emerald moment.

The badge that says a payment is proven on-chain. Emerald is reserved for exactly
this kind of confirmation, which is what makes it feel like a real event. The badge
is the only standing use of lucide `ShieldCheck`; the brand mark stays the custom
slit-shield SVG so identity and status never compete.

## Anatomy

- **Pill:** `rounded-full`, `verified-wash` fill (emerald 8%), `verified-line` ring
  (emerald 40%), a whisper of emerald glow behind it. Padding `px-2.5 py-0.5`.
- **Icon:** lucide `ShieldCheck`, 14px (inline) or 16px (standalone), `strokeWidth
  1.5`, `absoluteStrokeWidth`, in emerald (`verified`). `aria-hidden`.
- **Label:** "Verified on-chain" in `body-sm`, 500 weight, emerald text.
- **Optional Proof ID:** a tabular `Proof ID 789` in Geist Mono trailing the label,
  in `fg-subtle`, when the row has space for it.

## States

| State | Treatment |
| --- | --- |
| Verified | full badge, emerald wash + line + glow |
| Pending | neutral chip: `surface-3`, `border-hairline`, `fg-subtle`, no emerald, label "Pending" |
| Failed | danger chip: `danger-text` label, `danger` line, lucide `AlertCircle`, label "Failed" |
| On confirm | one-time emerald confirm ring as the badge appears (`animation: confirm`), then rests |

Emerald appears only in the verified state. Pending and failed never borrow it.

## Usage

- Use for a payment that is recorded and proven on-chain. Not for "submitted" or
  "in progress" (that is Pending, neutral).
- Copy is "Verified on-chain", never "Groth16 verified" or "proof valid". The
  cryptography is invisible.
- The badge is a designed status, not an emoji. Never use a lock or checkmark emoji
  in its place.
- Do not place the badge on busy or light fields; it reads against calm surfaces.

## Accessibility

- The badge carries real text ("Verified on-chain"); status is never conveyed by
  color or the icon alone. The icon is `aria-hidden`.
- Emerald-500 as text clears AA on all five surfaces (color-system.md audit: 5.35
  to 7.42:1); safe at `body-sm`.
- If the badge is interactive (links to the on-chain record), it is a `button` or
  `a` with an accessible name like "View on-chain record, Proof ID 789".
- The confirm ring is decorative; gate on `prefers-reduced-motion`.

## Code hints

```tsx
<span className="badge-verified">
  <ShieldCheck size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
  Verified on-chain
  {proofId && <span className="proof-id text-fg-subtle ml-1">Proof ID {proofId}</span>}
</span>
```

`.badge-verified` is defined in `token-mapping.md`:

```css
.badge-verified {
  color: hsl(var(--verified)); background: var(--verified-wash);
  box-shadow: 0 0 0 1px var(--verified-line), 0 0 16px -4px rgba(16,185,129,0.35);
}
```

Tokens: `verified`, `verified-wash`, `verified-line`, `fg-subtle`, `--font-mono`,
`confirm` keyframe. Related: `amount-disclosure.md`, `payroll-stepper.md`.
