# ShieldPay Brand Identity

> Canonical source. The current, canonical design system now lives in
> `.design/branding/shieldpay/` (identity, patterns, and `STYLE.md`). It was
> evolved through the GSP pipeline into a market-grade dark system: indigo
> (`#6366F1`) and emerald (`#10B981`) as the two-stop signal, a negative-space
> privacy-slit shield mark, and mono / tabular figures for exact values. Refer to
> that directory when in doubt. This file holds the earlier identity notes that the
> canonical system grew out of, kept for context.

> Consolidated visual identity for ShieldPay. This evolves the system already in
> the codebase (`tailwind.config.ts`, `app/globals.css`, `components/app-shell.tsx`,
> `app/page.tsx`). It does not reinvent the palette: it codifies it and gives the
> wordmark and mark a single source of truth a developer can ship in a day.

## 1. Positioning line

**ShieldPay: confidential payroll on Stellar. Private by default, auditable on demand.**

Supporting one-liner (already in the product): "Pay contributors in stablecoins,
keep each amount private on-chain, and prove it was correct without disclosing the
salary."

## 2. Personality and archetype

- **Archetype:** the Guardian with a Steward streak. We protect sensitive numbers
  and we keep clean books. Trust is the product.
- **Tone:** calm, precise, finance-grade. We sound like a CFO tool, not a crypto
  app. The cryptography is invisible (this is the codebase golden rule).
- **Three words:** trustworthy, discreet, exact.
- **What we are not:** not hacker or cyberpunk, not playful, not loud. No neon,
  no terminal-green, no black-with-green-text.

## 3. Color tokens (finalized, aligned to existing tokens)

The system is HSL CSS variables consumed through semantic Tailwind tokens. These
are the current values, locked in as canonical. Do not introduce raw hex in
components: always use the semantic token.

| Token (Tailwind)   | CSS var        | HSL              | Hex (ref) | Role |
| ------------------ | -------------- | ---------------- | --------- | ---- |
| `bg-background`    | `--background` | `222 47% 7%`     | `#0A0F1E` | App background, deepest slate |
| `bg-surface`       | `--surface`    | `222 39% 10%`    | `#0F1626` | Cards, panels |
| `bg-surface-2`     | `--surface-2`  | `221 33% 14%`    | `#18202F` | Raised surfaces, nested rows |
| `text-foreground`  | `--foreground` | `210 40% 98%`    | `#F8FAFC` | Primary text |
| `text-muted`       | `--muted`      | `215 18% 62%`    | `#8C97A8` | Secondary text, captions |
| `border-border`    | `--border`     | `215 25% 20%`    | `#2A3343` | Hairlines, dividers |
| `ring-ring`        | `--ring`       | `243 75% 63%`    | `#6366F1` | Focus ring (indigo) |
| `bg-primary`       | `--primary`    | `158 64% 42%`    | `#10B981` | Primary action, success, "verified" (emerald) |
| `bg-brand`         | `--brand`      | `243 75% 63%`    | `#6366F1` | Identity, logo, accents (indigo) |
| `bg-accent`        | `--accent`     | `243 75% 63%`    | `#6366F1` | Alias of brand |
| `bg-warning`       | `--warning`    | `38 92% 50%`     | `#F59E0B` | Warning (amber) |
| `bg-danger`        | `--danger`     | `0 84% 60%`      | `#EF4444` | Error, rejected proof (red) |

**Role discipline (the part that keeps it premium):**

- **Indigo (`brand`)** carries identity: logo, the privacy/"shield" idea, links,
  focus. It is the color of "protected."
- **Emerald (`primary`)** carries success and money in motion: the primary CTA,
  the "verified" badge, settled state. It is the color of "proven."
- These two are the only signature colors. The signature gradient is
  `from-brand to-primary` (indigo to emerald), already used on the landing
  headline and mark tile. It encodes the whole story: protected, then proven.
  Use it sparingly: headline accent, the mark, one hero element per view. Never
  on body text or large fills.
- Amber and red are functional only. They never decorate.

## 4. Typography

Keep **Inter** (already wired via `next/font/google` in `app/layout.tsx`, exposed
as `--font-inter`, mapped to `font-sans`). It is a clean neutral grotesk that
reads as fintech and ships with zero new dependencies.

- **Display / headings:** Inter, `tracking-tight` (already applied to `h1-h3`),
  weight 600 to 700. Headline accent uses the `brand -> primary` gradient clip.
- **Body:** Inter 400 to 500, `text-foreground` for primary, `text-muted` for
  secondary.
- **Numeric / hashes / amounts:** the mono stack (`--font-mono`, `font-mono`).
  Use mono for any value that must read as exact and machine-checked: amounts,
  tx hashes, commitments, proof IDs. This is a deliberate signal: mono = "this is
  a precise, verifiable figure."
- **Optional upgrade (not required this week):** enable Inter's tabular figures
  for tables and totals with `font-variant-numeric: tabular-nums` (Tailwind
  `tabular-nums`) so columns of amounts align.

## 5. Logo and wordmark

### Concept

A **shield whose interior is a checkmark formed by a privacy slit**. It keeps the
existing shield equity (users already see a shield) but makes it distinct from the
generic lucide `ShieldCheck`: the check is cut into the shield as negative space,
and the two strokes carry the signature indigo-to-emerald gradient (protected ->
proven). Simple geometry, one path, implementable as inline SVG. No illustration.

The wordmark is **"ShieldPay"** set in Inter 600, `tracking-tight`, with "Shield"
in `text-foreground` and "Pay" optionally in `text-foreground` as well (keep it
monochrome for the wordmark; let the mark carry the color). The mark sits in a
rounded tile (`rounded-lg`) for app chrome, or free-standing on the landing.

### Inline SVG (drop-in, gradient mark)

This is a single, self-contained mark. The gradient runs indigo (`brand`) to
emerald (`primary`), matching the codebase tokens.

```tsx
// components/brand-mark.tsx
export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="ShieldPay"
    >
      <defs>
        <linearGradient id="sp-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />   {/* brand / indigo */}
          <stop offset="100%" stopColor="#10B981" />  {/* primary / emerald */}
        </linearGradient>
      </defs>
      {/* Shield outline */}
      <path
        d="M12 2.5 4.5 5.5v6c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5v-6L12 2.5Z"
        stroke="url(#sp-grad)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Check cut into the shield */}
      <path
        d="M8.5 12.2 11 14.7 15.8 9.6"
        stroke="url(#sp-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

Lockup in app chrome (replaces the current `ShieldCheck` block in
`components/app-shell.tsx` and `app/page.tsx`):

```tsx
<span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/12">
  <BrandMark size={18} />
</span>
<span className="font-semibold tracking-tight">ShieldPay</span>
```

### Variants

- **Full color:** gradient mark on `bg-brand/12` tile (default app chrome, landing).
- **Monochrome:** swap `url(#sp-grad)` for `currentColor` so the mark inherits
  text color. Use this in the receipt PDF header, favicons at small sizes, and
  anywhere a single ink is needed.
- **Favicon / app icon:** the shield-check on a solid `surface` tile with the
  gradient mark. Keep a 2px safe margin so the shield does not touch the edge.

### Migration (one-day scope)

1. Add `components/brand-mark.tsx` above.
2. Replace the four current `ShieldCheck` brand usages (in `app-shell.tsx` x2,
   `app/page.tsx`, and the receipt PDF header in `lib/pdf/`) with `<BrandMark />`.
   Keep lucide `ShieldCheck` for non-brand UI affordances if any.
3. Regenerate favicon from the mark.

## 6. Iconography

- **Library:** lucide-react (already a dependency). One stroke icon family, keep
  it consistent. Default stroke 1.5 to 1.8, size 16 to 20 in dense UI.
- **Color:** icons are `text-muted` by default, `text-foreground` when active,
  `text-brand` for identity/privacy affordances, `text-primary` for success.
- **Privacy motif:** when you need a "hidden amount" cue, prefer a single subtle
  treatment (a small lock or eye-off lucide icon in `text-muted`, or a masked
  value like `••••`), never a literal "encrypted" or "hacker" visual.
- **Reserve the gradient for the brand mark only.** Functional icons stay single
  color.

## 7. Motion

- **Principle:** motion confirms, it does not entertain. Finance users want
  fast, legible feedback.
- **Defaults:** the existing `fade-in` (0.3s ease-out, 4px rise) is the house
  transition for cards and panels. Keep it.
- **Interactions:** buttons use brightness shifts on hover/active (already in
  `.btn-primary`, `.btn-ghost`), not scale or bounce.
- **Payroll progress:** the "sending -> proving -> verifying -> settled" sequence
  should be a calm stepper or progress bar with the emerald `primary` as the
  fill. No spinners-as-decoration, no confetti.
- **Respect `prefers-reduced-motion`:** disable the rise/fade for users who opt
  out (wrap animations or gate with the media query).
- **Durations:** 150 to 300ms. Nothing slower in core flows.

## 8. Do and Don't

**Do**
- Use semantic tokens (`bg-surface`, `text-muted`, `bg-brand`, `bg-primary`) in
  every component.
- Keep indigo for identity/privacy, emerald for success/money, the gradient for
  the mark and one hero accent.
- Use mono + tabular figures for amounts, hashes, and proof IDs.
- Keep cryptography invisible: plain language in UI, technical terms only in the
  legal/receipt artifacts.
- Keep generous slate surfaces and hairline borders. Let the layout breathe.

**Don't**
- Don't add raw hex in components or introduce a new accent color.
- Don't use neon green, terminal green, or black-with-green-text. No cyberpunk.
- Don't put the gradient on body text, large fills, or multiple elements per view.
- Don't surface "ZK", "Soroban", "BN254", "Poseidon" in end-user UI. They belong
  in receipts, docs, and the pitch.
- Don't mix icon families or vary stroke weights randomly.
- Don't animate for delight in money flows. Confirm, don't celebrate.
```
