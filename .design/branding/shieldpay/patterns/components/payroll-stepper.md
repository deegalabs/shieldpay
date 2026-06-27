# Payroll Stepper (sending -> proving -> verifying -> settled)

> Phase: guidelines | Brand: ShieldPay | Generated: 2026-06-27
> Tier 3 custom component. The trust-critical confirm moment.

The stepper shown when a payroll run executes. It animates the brand's core
meaning, protected becoming proven, by traveling the connector from indigo to
emerald. It is the one place motion earns its keep. No spinner, no loop.

## Anatomy

- **Four stages**, left to right: Sending, Proving, Verifying, Settled.
- **Step node:** a small circle. Pending = `border-strong` ring on `surface-2`.
  Active = indigo fill (`brand`) with the indigo focus glow. Done = indigo check.
  The final node, Settled, lands emerald (`verified`) with the confirm ring.
- **Connector:** a 2px rule between nodes. It fills left to right as the run
  progresses. The fill is the indigo to emerald gradient at 135deg, revealed by
  progress, so by Settled the whole connector reads indigo on the left and emerald
  at the settled end.
- **Stage label:** `body-sm`, `fg-subtle` when pending, `fg-strong` when active or
  done.
- **Counter (optional):** a tabular `12 of 12 paid` figure in Geist Mono.

## States

| Stage | Node | Connector to it | Label | Meaning |
| --- | --- | --- | --- | --- |
| Sending | indigo active | filling indigo | "Sending" | USDC transactions submitted |
| Proving | indigo active | indigo | "Proving" | proofs generated off-chain (protected) |
| Verifying | indigo->transition | indigo blending toward emerald | "Verifying" | proofs verified on-chain |
| Settled | emerald + confirm ring | emerald | "Settled" | recorded, proven |

Each stage eases in over `dur-base` (240ms) with `--ease-physical`. The transition
is discrete and stepped, one stage at a time, not a continuous bar. Settled lands
with a one-time emerald confirm ring (`animation: confirm`), then rests. Nothing
loops or spins. A failure swaps the active node to `danger` and the label to
danger-text; the run halts at that stage.

## Usage

- Use for the payroll run only, the moment a CFO commits a batch. Do not reuse it
  as a generic progress bar.
- Copy is calm and exact: "Sending", "Proving", "Verifying", "Settled". Never
  "Generating Groth16 proof"; the cryptography is invisible.
- On completion, hand off to the success summary with the verified amounts and
  Proof IDs. The stepper is the journey; the table is the record.

## Accessibility

- Wrap in `role="status"` `aria-live="polite"`; announce each stage label as it
  becomes active so screen readers follow the run without relying on color or motion.
- Each node carries an accessible name ("Sending, in progress" / "Settled,
  complete"). State is conveyed by text and shape (check, ring), not color alone.
- Gate all motion on `prefers-reduced-motion`: connectors and confirm ring become
  instant state changes; the `aria-live` announcements still fire.

## Code hints

```tsx
const stages = ['Sending', 'Proving', 'Verifying', 'Settled'] as const;

<ol role="status" aria-live="polite" className="flex items-center gap-0">
  {stages.map((label, i) => (
    <li key={label} className="flex items-center">
      <span data-state={stateOf(i)}            // pending | active | done | settled | failed
        className="stepper-step grid place-items-center size-7 rounded-full" />
      {i < stages.length - 1 && (
        <span className="stepper-connector h-0.5 w-16"
          style={{ ['--progress' as string]: `${progressTo(i)}%` }} />
      )}
    </li>
  ))}
</ol>
```

```css
.stepper-step[data-state="pending"]  { background: hsl(var(--surface-2)); box-shadow: inset 0 0 0 1px hsl(var(--border-strong)); }
.stepper-step[data-state="active"]   { background: hsl(var(--brand)); box-shadow: 0 0 0 3px rgba(99,102,241,0.18); }
.stepper-step[data-state="done"]     { background: hsl(var(--brand)); }
.stepper-step[data-state="settled"]  { background: hsl(var(--verified)); animation: confirm var(--dur-base) var(--ease-physical); }
.stepper-step[data-state="failed"]   { background: hsl(var(--danger)); }
.stepper-connector { background:
  linear-gradient(90deg, #6366F1, #10B981) left / var(--progress,0%) 100% no-repeat,
  hsl(var(--border));
  transition: background-size var(--dur-base) var(--ease-physical); }
@media (prefers-reduced-motion: reduce) {
  .stepper-step { animation: none; }
  .stepper-connector { transition: none; }
}
```

Tokens: `brand`, `verified`, `border-strong`, `danger`, `--gradient`, `confirm`
keyframe, `--dur-base`, `--ease-physical`. Related: `verified-badge.md`, STYLE.md
Bold Bet 5.
