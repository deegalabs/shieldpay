# Token Mapping — the apply bridge

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27

This is the EVOLVE delta. It gives the exact, paste-ready `:root` block for
`app/globals.css`, the `theme.extend` deltas for `tailwind.config.ts`, and the
restyled `@layer components` block. The architecture is unchanged: HSL triplets
exposed through `hsl(var(--x) / <alpha-value>)`, plus rgba vars where a foreground
tier or wash needs alpha baked in. Names that exist are kept (`surface`,
`foreground`, `border`, `ring`, `brand`, `primary`, `warning`, `danger`); the dead
`accent` token is repurposed as `--fg-strong`.

Source for every value: `../identity/color-system.md` and `../identity/palettes.json`.
The WCAG AA audit is already done there; do not re-run a validator.

---

## 1. `app/globals.css` — the evolved `:root`

Replace the current `:root` inside `@layer base` with this. HSL triplets are used
where the Tailwind `hsl(var(--x) / <alpha-value>)` mechanism applies; the four
foreground tiers and the wash/line/gradient values carry their own alpha as full
color strings (consumed as raw vars, not through `<alpha-value>`).

```css
:root {
  /* type + shape */
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, 'SF Mono', monospace;
  --radius: 0.75rem;

  /* --- elevation ramp (lightness-based; HSL triplets) -------------------- */
  --surface-base: 223 49% 8%;   /* #0B1120 page canvas                       */
  --background: 223 49% 8%;      /* alias of surface-base (keeps `background`) */
  --surface: 222 47% 11%;        /* #0F172A surface-1, cards/panels          */
  --surface-2: 222 34% 15%;      /* #1A2235 nested, table header, sidebar    */
  --surface-3: 217 33% 17%;      /* #1E293B hover, raised/selected rows      */
  --surface-overlay: 221 33% 20%;/* #232E45 modals/popovers/dropdowns        */

  /* --- borders ----------------------------------------------------------- */
  --border: 217 32% 18%;         /* #1F2A3C border-hairline (keeps `border`) */
  --border-strong: 218 30% 25%;  /* #2C3A52 focused/active edges, active row */

  /* --- foreground tiers (white at alpha; raw rgba, not <alpha-value>) ----- */
  --foreground: 248 250 252;     /* base white triplet for fg-default below   */
  --fg-default: rgba(248, 250, 252, 0.98); /* headings, lead figures, amounts */
  --fg-strong:  rgba(248, 250, 252, 0.86); /* body, labels (was dead `accent`)*/
  --fg-subtle:  rgba(248, 250, 252, 0.66); /* secondary, table meta (was muted)*/
  --fg-faint:   rgba(248, 250, 252, 0.45); /* captions, disabled (AA-large)   */

  /* --- signal: indigo (brand/protected/focus) ---------------------------- */
  --brand: 239 84% 67%;          /* #6366F1 fills, borders, focus ring only   */
  --ring: 239 84% 67%;           /* #6366F1 focus ring                        */
  --brand-text: 234 89% 74%;     /* #818CF8 indigo-400, the ONLY indigo text  */
  --brand-wash: rgba(99, 102, 241, 0.08);
  --brand-line: rgba(99, 102, 241, 0.40);

  /* --- signal: emerald (verified/settled/proven; == primary action) ------ */
  --primary: 160 84% 39%;        /* #10B981 emerald action / verified         */
  --primary-foreground: 166 91% 9%; /* #022C22 ink on emerald                  */
  --verified: 160 84% 39%;       /* alias of primary (semantic clarity)       */
  --verified-wash: rgba(16, 185, 129, 0.08);
  --verified-line: rgba(16, 185, 129, 0.40);

  /* --- functional only --------------------------------------------------- */
  --warning: 38 92% 50%;         /* #F59E0B amber (fg black)                  */
  --danger: 0 84% 60%;           /* #EF4444 red fills/large                   */
  --danger-text: 0 91% 71%;      /* #F87171 red-400 danger text on dark       */

  /* --- the one ornament: gradient as LIGHT (never paint/fill/text) -------- */
  --gradient: linear-gradient(135deg, #6366F1, #10B981);

  /* --- motion (Geist lineage; confirm-or-reveal only) -------------------- */
  --ease-physical: cubic-bezier(0.175, 0.885, 0.32, 1.1);
  --dur-instant: 100ms;
  --dur-fast: 160ms;
  --dur-base: 240ms;
  --dur-slow: 360ms;
}
```

Update `body` to the gradient-as-light ambient (replace the existing two-gradient
rule). This matches the imagery-style recipe: low-intensity light behind the dark,
`fixed`, collapses gracefully under `prefers-contrast: more`.

```css
body {
  @apply bg-background text-foreground antialiased;
  color: var(--fg-strong);                 /* body register is fg-strong */
  font-optical-sizing: auto;               /* headings pick up Inter Display */
  background-image:
    radial-gradient(60rem 40rem at 15% -10%, rgba(99,102,241,0.06), transparent 60%),
    radial-gradient(50rem 36rem at 100% 0%, rgba(16,185,129,0.04), transparent 60%);
  background-color: hsl(var(--surface-base));
  background-attachment: fixed;
}

@media (prefers-contrast: more) {
  body { background-image: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

---

## 2. `tailwind.config.ts` — `theme.extend` deltas

Add the new color slots, the overlay-only shadow, the stepper keyframes/durations,
and the display + mono font stacks. Keep every existing key.

```ts
colors: {
  background:   'hsl(var(--background) / <alpha-value>)',
  'surface-base': 'hsl(var(--surface-base) / <alpha-value>)', // NEW page canvas
  surface:      'hsl(var(--surface) / <alpha-value>)',        // surface-1
  'surface-2':  'hsl(var(--surface-2) / <alpha-value>)',
  'surface-3':  'hsl(var(--surface-3) / <alpha-value>)',      // NEW hover/raised
  'surface-overlay': 'hsl(var(--surface-overlay) / <alpha-value>)', // NEW
  foreground:   'var(--fg-default)',                          // repointed to rgba tier
  'fg-strong':  'var(--fg-strong)',                           // NEW body
  'fg-subtle':  'var(--fg-subtle)',                           // NEW (replaces muted role)
  'fg-faint':   'var(--fg-faint)',                            // NEW caption/disabled
  muted:        'var(--fg-subtle)',                           // legacy alias -> fg-subtle
  border:       'hsl(var(--border) / <alpha-value>)',         // hairline
  'border-strong': 'hsl(var(--border-strong) / <alpha-value>)', // NEW active edge
  ring:         'hsl(var(--ring) / <alpha-value>)',
  primary: {
    DEFAULT:    'hsl(var(--primary) / <alpha-value>)',        // emerald action
    foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
  },
  verified:     'hsl(var(--verified) / <alpha-value>)',       // NEW emerald semantic
  brand:        'hsl(var(--brand) / <alpha-value>)',          // indigo (UI/fill/border only)
  'brand-text': 'hsl(var(--brand-text) / <alpha-value>)',     // NEW indigo-400 for text
  accent:       'hsl(var(--brand) / <alpha-value>)',          // legacy alias -> brand indigo
  warning:      'hsl(var(--warning) / <alpha-value>)',
  danger:       'hsl(var(--danger) / <alpha-value>)',
  'danger-text':'hsl(var(--danger-text) / <alpha-value>)',    // NEW red-400 for text
},
borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 4px)',
  sm: 'calc(var(--radius) - 8px)',
  xl: 'calc(var(--radius) + 4px)',
  '2xl': 'calc(var(--radius) + 8px)',
},
fontFamily: {
  sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
  display: ['var(--font-inter)', 'system-ui', 'sans-serif'], // NEW (opsz axis -> Display)
  mono:    ['var(--font-mono)', 'ui-monospace', 'monospace'],
},
boxShadow: {
  // elevation is lightness-based on dark; these are the top-edge highlights, not shadows
  'edge':      'inset 0 1px 0 rgba(255,255,255,0.04)',        // NEW level 1/3 top light
  'edge-2':    'inset 0 1px 0 rgba(255,255,255,0.06)',        // NEW level 2 top light
  'edge-brand':'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 2px 0 -1px rgba(99,102,241,0.18)', // NEW primary card rim
  // drop shadow ONLY at the overlay level
  'overlay':   '0 16px 48px -16px rgba(0,0,0,0.65)',          // NEW modals/popovers
  'verified-glow': '0 0 0 1px rgba(16,185,129,0.40), 0 0 16px -4px rgba(16,185,129,0.35)', // NEW
  // legacy keys kept so existing className refs do not break
  card: 'inset 0 1px 0 rgba(255,255,255,0.04)',               // repointed: top-edge, not drop
  elevated: '0 16px 48px -16px rgba(0,0,0,0.65)',
  glow: '0 0 0 1px hsl(var(--border)), 0 8px 30px -12px hsl(var(--brand) / 0.45)',
},
keyframes: {
  'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  // stepper + amount reveal (confirm-or-reveal only)
  'reveal':  { from: { opacity: '0' }, to: { opacity: '1' } },                          // NEW amount cross-fade
  'border-sweep': { '0%': { borderColor: 'var(--brand-line)' }, '100%': { borderColor: 'var(--verified-line)' } }, // NEW indigo->emerald
  'confirm': { '0%': { boxShadow: '0 0 0 0 rgba(16,185,129,0.0)' }, '40%': { boxShadow: '0 0 0 3px rgba(16,185,129,0.35)' }, '100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0.0)' } }, // NEW settled landing
},
animation: {
  'fade-in':     'fade-in var(--dur-slow) var(--ease-physical)',
  'reveal':      'reveal var(--dur-base) var(--ease-physical)',          // NEW
  'border-sweep':'border-sweep var(--dur-base) var(--ease-physical)',    // NEW
  'confirm':     'confirm var(--dur-base) var(--ease-physical)',         // NEW one-shot, no loop
},
```

Note on `fade-in`: kept, but its philosophy is now governed by the restrained
motion token set above; reduced-motion is gated globally in `globals.css`.

---

## 3. `@layer components` — restyled classes (paste-ready delta)

Drop-in replacement for the existing `@layer components` block. Legacy class names
are preserved and restyled; new utilities are added. Each maps to its identity
source.

```css
@layer components {
  /* page canvas helper (identity: surface-base) */
  .surface-base { background-color: hsl(var(--surface-base)); }

  /* --- cards: elevation by lightness + 1px top-edge highlight, no drop shadow --- */
  /* identity: color-system "neutral depth engine" */
  .card {
    @apply rounded-xl border border-border bg-surface p-6;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);     /* top-edge light */
  }
  .card-2 {
    @apply rounded-xl border border-border bg-surface-2 p-6;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);     /* level 2 slightly stronger */
  }
  /* the one figure cluster that glows: faint indigo top rim (gradient-as-light) */
  .card-primary {
    @apply rounded-xl border border-border bg-surface p-6;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04),
                inset 0 2px 0 -1px rgba(99,102,241,0.18);
  }
  /* overlay is the ONLY surface that gets a drop shadow */
  .surface-overlay {
    @apply rounded-xl border bg-surface-overlay p-4;
    border-color: hsl(var(--border-strong));
    box-shadow: 0 16px 48px -16px rgba(0,0,0,0.65);
  }

  /* --- buttons --- */
  /* PRIMARY = indigo (protected/primary affordance). identity: brand fill, white label 4.47:1 */
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5
           font-medium text-white transition disabled:opacity-50 disabled:pointer-events-none;
    transition-duration: var(--dur-fast);
    transition-timing-function: var(--ease-physical);
  }
  .btn-primary:hover { filter: brightness(1.10); }
  .btn-primary:active { filter: brightness(0.95); }

  /* VERIFIED/SUCCESS action = emerald. Reserved for confirm/settle CTAs only. */
  .btn-verified {
    @apply inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5
           font-medium transition disabled:opacity-50 disabled:pointer-events-none;
    color: hsl(var(--primary-foreground));
    transition-duration: var(--dur-fast);
    transition-timing-function: var(--ease-physical);
  }
  .btn-verified:hover { filter: brightness(1.10); }

  /* SECONDARY = neutral surface step (was .btn-ghost; kept). */
  .btn-secondary, .btn-ghost {
    @apply inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2
           px-4 py-2.5 font-medium transition disabled:opacity-50 disabled:pointer-events-none;
    color: var(--fg-strong);
    transition-duration: var(--dur-fast);
    transition-timing-function: var(--ease-physical);
  }
  .btn-secondary:hover, .btn-ghost:hover {
    @apply bg-surface-3;
    border-color: hsl(var(--border-strong));               /* border-brighten */
  }

  /* --- input: indigo focused-field glow (protected + receiving input) --- */
  /* identity: imagery-style ".field:focus-visible" recipe */
  .input {
    @apply w-full rounded-lg border border-border px-3 py-2 outline-none transition;
    background-color: hsl(var(--surface-base) / 0.60);
    color: var(--fg-default);
    transition-duration: var(--dur-fast);
    transition-timing-function: var(--ease-physical);
  }
  .input::placeholder { color: var(--fg-faint); }
  .input:focus-visible {
    border-color: var(--brand-line);                       /* indigo line */
    box-shadow: 0 0 0 3px rgba(99,102,241,0.18);           /* soft inner indigo glow */
  }

  /* --- verified badge: emerald wash + line + earned glow + tabular Proof ID --- */
  /* identity: imagery-style ".badge-verified" recipe; pair with lucide ShieldCheck */
  .badge-verified {
    @apply inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium;
    color: hsl(var(--verified));
    background: var(--verified-wash);
    box-shadow: 0 0 0 1px var(--verified-line), 0 0 16px -4px rgba(16,185,129,0.35);
  }

  /* --- dense table row (52px standard / 44px compact) --- */
  /* identity: typography row-height spec + Density 7 */
  .row-dense {
    height: 52px;
    border-bottom: 1px solid hsl(var(--border));
  }
  .row-dense.is-compact { height: 44px; }
  .row-dense:hover { background-color: hsl(var(--surface-3)); }   /* alpha-step */
  .row-dense[data-selected="true"] {
    background-color: hsl(var(--surface-3));
    box-shadow: inset 2px 0 0 0 hsl(var(--brand));                /* active indigo rule */
  }

  /* --- figure: the mandatory mono + tabular contract --- */
  /* identity: typography figure CSS contract */
  .figure, .proof-id, .hash, td.amount {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "ss01" 1;
    font-weight: 480;
  }
  td.amount { text-align: right; }              /* decimals stack, magnitudes scan */

  /* --- hero lead-number wash: the ONE figure that glows (gradient-as-light) --- */
  .figure-hero {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    background: linear-gradient(135deg, #818CF8, #34D399);   /* 400 stops for legible clip */
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}
```

---

## 4. Identity-source crosswalk

| Class / token | Identity source |
| --- | --- |
| `--surface-base..overlay`, `--border-*` | color-system.md "neutral depth engine" + palettes.json surfaces |
| `--fg-default/strong/subtle/faint` | color-system.md "4-rung text hierarchy"; AA audit table |
| `--brand`, `--brand-text`, `brand-wash/line` | color-system.md "indigo to emerald as one signal" |
| `--primary`/`--verified`, `verified-wash/line` | color-system.md emerald = proven |
| `--gradient`, `.figure-hero`, `.card-primary` rim | color-system.md + imagery-style.md gradient-as-light recipes |
| `--ease-physical`, `--dur-*` | shieldpay.yml motion / STYLE.md motion (Geist lineage) |
| `.input:focus-visible` glow | imagery-style.md `.field:focus-visible` |
| `.badge-verified` glow | imagery-style.md `.badge-verified` |
| `.figure`, `td.amount` | typography.md figure CSS contract |
| `.row-dense` 52/44 | typography.md + color-system.md row heights |
| `font-optical-sizing: auto` | typography.md font loading (Inter Display via opsz) |

This is a paste bridge for the existing files, not a shadcn `theme.json`. The
codebase is not a standard `components.json` install; apply these deltas directly
to `app/globals.css` and `tailwind.config.ts`.
