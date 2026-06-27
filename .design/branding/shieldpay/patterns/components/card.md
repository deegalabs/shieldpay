# Card (override)

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27
> Tier 2 override. Captures the no-shadow, lightness-elevation rule.

The card is the basic surface unit. The override that tokens cannot express on
their own: cards get no drop shadow. Elevation is read from surface lightness plus a
1px top-edge highlight. Shadow exists only at the overlay level.

## Variants

| Variant | Class | Surface | Top edge | Use |
| --- | --- | --- | --- | --- |
| Default | `.card` | `surface-1` | highlight 4% | primary cards, panels |
| Nested | `.card-2` | `surface-2` | highlight 6% | nested cards inside a card, sidebar blocks |
| Primary | `.card-primary` | `surface-1` | highlight 4% + faint indigo rim | the one hero figure cluster |
| Overlay | `.surface-overlay` | `surface-overlay` | none | modals, popovers, dropdowns (the only drop shadow) |

## States

| State | Treatment |
| --- | --- |
| Default | flat surface, top-edge highlight, hairline border |
| Hover (interactive cards) | border to `border-strong` (border-brighten), no lift, no shadow |
| Selected | 2px inset indigo left rule or full indigo line border |
| Focus (interactive) | indigo focus ring |

## Usage

- Use `.card-primary` for exactly one cluster per screen, the hero figure (operating
  balance, paid this month). Its indigo top rim is gradient-as-light, the one place
  a card glows. Everything else is neutral.
- Never add `box-shadow` drop shadows to `.card` or `.card-2`. If a card needs to
  feel raised, step its surface lighter, do not shadow it.
- Radius `xl`. Padding from the 8-base scale (`p-6` standard).
- Cards sit on `surface-base`; nested cards step to `surface-2`. Keep the ramp
  ordered so planes never invert.

## Accessibility

- A card is a container, not a control, unless it is a link/button; then it needs an
  accessible name and a visible focus ring.
- Adjacent surface steps sit at 1.05 to 1.13 luminance contrast: distinct without a
  border, but keep the hairline border for clarity under `prefers-contrast: more`,
  where the ambient light collapses.

## Code hints

```tsx
<div className="card">…</div>
<div className="card-primary">
  <p className="text-overline text-fg-subtle">Operating balance</p>
  <p className="figure-hero text-4xl">$12,450.00 USDC</p>   {/* the one number that glows */}
</div>
```

```css
.card         { background: hsl(var(--surface));   box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
.card-2       { background: hsl(var(--surface-2)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }
.card-primary { box-shadow: inset 0 1px 0 rgba(255,255,255,0.04),
                            inset 0 2px 0 -1px rgba(99,102,241,0.18); }
```

Tokens: `surface`, `surface-2`, `surface-overlay`, `border`, `border-strong`,
`brand`. Related: `token-mapping.md`, STYLE.md Bold Bet 2 and 3.
