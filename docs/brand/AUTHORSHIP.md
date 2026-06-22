# Authorship and Credits

> How to present the team, license, and attribution for the ShieldPay submission
> to Stellar Hacks: ZK. Fill the placeholders before submitting. Nothing here is
> invented: names and handles are placeholders for the user to complete.

## 1. Team presentation

Present authors plainly, finance-grade, no hype. Suggested block for the README
(add near the bottom, above the License section) and the pitch deck closing slide:

```md
## Authors

Built by [TEAM OR STUDIO NAME] for Stellar Hacks: ZK 2026.

- [FULL NAME] — [role, e.g. product and frontend] — [@github] · [link]
- [FULL NAME] — [role, e.g. ZK and contracts] — [@github] · [link]
- [FULL NAME] — [role, e.g. design] — [@github] · [link]
```

Notes:
- List each person once, with a single clear role. Avoid stacked titles.
- If solo, use one line: `Built by [FULL NAME] ([@github]) for Stellar Hacks: ZK 2026.`
- Keep links to GitHub or a portfolio. No personal contact details in a public repo.
- The repo is under the org/working path `deegalabs/shieldpay`. If "Deega Labs"
  is the studio name, use it as `[TEAM OR STUDIO NAME]` and keep individual
  credits underneath.

## 2. License note

The repository is **MIT** (see `LICENSE`). Keep the existing README badge and the
License section. Recommended copyright line in `LICENSE` and any headers:

```
Copyright (c) 2026 [TEAM OR STUDIO NAME / FULL NAME]
```

Third-party credit, state honestly that ShieldPay builds on open work:

```md
ShieldPay builds on open-source work: Stellar and Soroban, the Circom and snarkjs
Groth16 toolchain, a Noir reference circuit, Next.js, Tailwind, and shadcn/ui.
The Groth16 verifier follows the Stellar soroban-examples reference. Thanks to
the Stellar developer community.
```

## 3. One-line attribution style

For the README footer and the pitch deck:

```
ShieldPay — confidential payroll on Stellar + ZK. Built by [TEAM OR STUDIO NAME]
for Stellar Hacks: ZK 2026. MIT licensed.
```

The README already closes with:
`Built on Stellar and Zero-Knowledge · Stellar Hacks: ZK 2026`.
Keep that line and add the authorship block above it so credit and provenance are
both visible.

## 4. Submission checklist (authorship)

- [ ] Replace every `[PLACEHOLDER]` with real names, roles, and handles.
- [ ] Confirm `LICENSE` copyright line matches the team/studio name.
- [ ] Add the Authors block to the README above the License section.
- [ ] Add the one-line attribution to the closing pitch slide.
- [ ] Keep the third-party credit paragraph so open-source provenance is clear.
```
