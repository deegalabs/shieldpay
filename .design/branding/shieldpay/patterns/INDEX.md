# ShieldPay Patterns — Index

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27

Operational design-system artifacts for ShieldPay. Identity is locked in
`../identity/`; these files translate it into code-ready tokens, the agent contract,
the visual brand guide, and component specs. System strategy: EVOLVE (extend the
existing HSL-var token architecture; do not break names).

## Core

| File | What it is |
| --- | --- |
| [shieldpay.yml](./shieldpay.yml) | Single source of truth in the GSP preset schema. Tokens (shadcn slots + the `shieldpay-extras` bespoke spine), typography, shape, elevation, spacing, motion, patterns, constraints, effects. Intensity variance 2 / motion 2 / density 7. |
| [STYLE.md](./STYLE.md) | The agent contract: Intensity, Philosophy, Patterns, Constraints, Effects, the 5 Bold Bets, Implementation recipes, Voice. |
| [guidelines.html](./guidelines.html) | Self-rendering dark visual brand guide using the brand's own tokens and type. Open in a browser. |

## Components

| File | Tier | What it covers |
| --- | --- | --- |
| [components/token-mapping.md](./components/token-mapping.md) | Bridge | The apply delta: exact `:root` for `app/globals.css`, `theme.extend` deltas for `tailwind.config.ts`, restyled `@layer components`. Paste-ready. |
| [components/amount-disclosure.md](./components/amount-disclosure.md) | 3 | masked -> verified -> disclosed amount (the signature pattern). |
| [components/payroll-stepper.md](./components/payroll-stepper.md) | 3 | sending -> proving -> verifying -> settled, indigo->emerald connector. |
| [components/data-table.md](./components/data-table.md) | 3 | dense 52/44px table, tabular right-aligned currency, verified column. |
| [components/verified-badge.md](./components/verified-badge.md) | 3 | the earned emerald verified badge (lucide ShieldCheck). |
| [components/button.md](./components/button.md) | 2 | indigo primary / emerald verified / neutral secondary split. |
| [components/card.md](./components/card.md) | 2 | lightness elevation, no drop shadow, indigo top rim on the hero card. |
| [components/input.md](./components/input.md) | 2 | indigo focused-field glow. |

## Apply phase

The token bridge ([token-mapping.md](./components/token-mapping.md)) targets two
existing files:

- `app/globals.css` — replace `:root`, repoint `body` to the gradient-as-light
  ambient, restyle `@layer components`.
- `tailwind.config.ts` — extend `colors`, `boxShadow`, `keyframes`, `animation`,
  `fontFamily` with the deltas.

No `theme.json` is emitted (the codebase is not a standard shadcn `components.json`
install). The WCAG AA contrast audit is already measured in
`../identity/color-system.md`.
