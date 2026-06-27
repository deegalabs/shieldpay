# ShieldPay Brand Brief

> Phase: brief | Brand: ShieldPay | Mode: evolve

---

## What it is
Confidential payroll for DAOs and Web3 teams on Stellar + zero-knowledge proofs.
You pay contributors in stablecoins, each amount stays private on-chain (a
Groth16 proof verified inside a Soroban smart contract proves the payment was
correct without revealing the salary), and the company can disclose exact
figures only to an authorized auditor via a viewing key. Live on testnet. Three
portals: company (CFO/HR), worker/contractor, auditor.

## Positioning
Finance-grade, quiet, trustworthy. "Cryptography is invisible": the end user
never sees ZK/Soroban/BN254 jargon. The product should feel like premium fintech
(Stripe, Mercury, Deel, Ramp), not crypto/hacker. Privacy by default, auditable
on demand, verifiable by anyone.

## Personas
- **Company (CFO / Ops):** wants payroll that is private, provable, and simple.
  Compares us to Deel/QuickBooks/Stripe dashboards. Skeptical of "crypto."
- **Worker / Contributor:** receives pay, wants a clear record and an easy
  cash-out. Wants to trust it without understanding ZK.
- **Auditor / Accountant:** read-only, time-boxed access, exports for filing.

## Competitive landscape (research these as the market bar)
Stripe (dashboard clarity, trust), Mercury (calm premium fintech), Ramp (dense
but elegant data UI), Deel (global payroll, contractor UX), Linear (craft,
motion, restraint), Coinbase (crypto made calm/legible), QuickBooks (accounting
legitimacy). The bar: professional, data-dense yet calm, confidence through
restraint.

## Brand essence
Guardian / Steward. Protects sensitive numbers and keeps clean books. Signature
motif today: a single indigo-to-emerald gradient meaning "protected, then
proven." Calm slate surfaces, exact monospaced figures.

## Current identity (to evolve, not discard)
- Palette (HSL/hex, semantic tokens in app/globals.css + tailwind.config.ts):
  surfaces slate-900 #0F172A and slate-800 #1E293B; text slate-50 #F8FAFC and
  muted #94A3B8; brand indigo #6366F1; primary emerald #10B981; warning amber
  #F59E0B; danger red #EF4444.
- Type: Inter via next/font. Monospace + tabular for amounts, hashes, proof ids.
- Mark: inline BrandMark (components/ui/brand-mark.tsx), a shield-check carrying
  the indigo-to-emerald gradient.
- Stack: Next.js 14, Tailwind 3.4, shadcn-style (Radix) components, 19
  components, no motion library yet.
- Notes: docs/brand/IDENTITY.md, docs/brand/AUTHORSHIP.md.

## The problem to solve (why this audit)
The UI works but feels bland and lifeless. It is correct and calm but lacks the
craft, depth, and confidence of the market leaders. We want to ELEVATE it to a
market-grade, professional identity and design system (color, typography,
spacing, components, motion), grounded in real working products, then apply it
across the three portals. Keep the trust and calm; add craft, hierarchy, depth,
and a little life.

## Constraints
- No neon, no cyberpunk/hacker aesthetic. Finance-grade and calm.
- Dark-first (the app is dark). Must stay accessible (WCAG AA).
- Tailwind semantic tokens are the implementation surface; evolve them, do not
  break the architecture.
- English UI. Submission for the "Stellar Hacks: ZK" hackathon.
