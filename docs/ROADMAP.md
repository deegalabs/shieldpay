# ShieldPay Roadmap

Where the product is, what is scaffolded but not finished, and what is deliberately
deferred. Written to be honest: shipped means built, tested, and (for on-chain work)
validated on testnet. Base means the structure and contracts exist but a full
production path (usually an external integration or a contract redeploy) is not done
yet. Deferred means designed and documented but not started.

Last updated: 2026-07-03.

## Legend

- Shipped: built, verified, and live (on-chain items validated on Stellar testnet).
- Base only: interfaces, schema, and a working default or mock exist, so the feature
  runs end to end in the app, but the production integration is stubbed and clearly
  labeled. Safe to demo, not yet safe to rely on for real filings or settlement.
- Deferred: specified in this repo, not implemented. Mostly needs a contract
  redeploy or external partners.

## Shipped

### Confidential payroll core
- Per-payment range proof (Circom + Groth16, BN254), verified on-chain by the
  `payment_verifier` Soroban contract. The amount is a Poseidon commitment, never
  stored in clear. Validated on testnet.
- Aggregate Proof-of-Payroll: one proof over a whole run proves the total and each
  line's range without revealing any salary. Each aggregate line is bound on-chain
  to a recorded per-payment proof of the same company with a matching range. Live on
  testnet.
- Identity anchor: `anchor_registry` binds a worker's Stellar address to their
  contract metadata (self-anchored), with a worker-cosigned range.
- Three portals (company, worker, auditor), seedless auth, non-custodial signing
  (the company can sign its own on-chain calls, with a custodial server signer as a
  fallback).
- Selective disclosure: a viewing key reveals and re-verifies exact amounts against
  the on-chain commitments. Disclosure is logged, and auditor links can be one-time.

### Proof of income (F1), the differentiator
- `income_credential` circuit: an employer BabyJubJub key signs each of the worker's
  monthly records, and the circuit proves the sum sits in a claimed range, revealing
  no monthly figure. A per-verifier nullifier makes each credential replay-safe.
- `income_verifier` Soroban contract runs the real BN254 pairing check on-chain and
  records the nullifier. Validated on testnet.
- App flow: a company issues an employer-attested proof of income for a worker, a
  public wallet-free page verifies any credential straight from the contract, and
  the worker UI exposes it.
- Reviewed in security round 6: no critical or high finding.

### Proof-of-Income document (F2)
- A formal, downloadable Proof-of-Income statement (PDF) for a bank, consulate, or
  tax office. Reuses the F1 credential: proven income range over a period, the
  attesting employer key, the on-chain credential id, and a QR to the public
  verifier. No exact amount.

### Cross-border proof of funds or employment (F5)
- Covered by composition, not a separate build. The credential's verifier label is
  free text and the verifier page is public, so a worker issues a credential labeled
  for a specific consulate or lender, shares the on-chain verify link, and attaches
  the F2 document. No new ZK or contract surface.

### Trust and delivery
- One-click on-chain verify panel on the landing page.
- `pnpm demo`: records a real proof, then shows a forged proof and a replayed
  payment rejected on-chain.
- CI that compiles, proves, and verifies both circuits on every push, including a
  tampered-proof rejection.

## Base only (runs in the app, integration stubbed)

### Fiscal document linkage (F3, notas fiscais / NFS-e)
- What exists: a `fiscal_link` record that ties a payment to an external invoice
  reference, an API surface to create and read links, a receipt field that shows the
  linked invoice, and a mockable NFS-e adapter behind a single interface.
- What is stubbed: the adapter does not call a real municipal NFS-e web service. It
  returns a deterministic mock so the flow is demoable and testable.
- To finish: implement a concrete adapter per municipality (or via a provider like
  Focus NFe or eNotas), handle their auth, retries, and status callbacks. External
  dependency, so it stays base only until a provider is chosen.

### Compliance / KYC hook (E2)
- What exists: a `ComplianceCheck` interface with a default allow decision derived
  from the existing anchor (an address that is anchored for the paying company is
  allowed), enforced as a gate before a payment is prepared, with tests.
- What is stubbed: no external sanctions or KYC provider is wired. The default is
  anchor-based only.
- To finish on-chain: move the gate into the settlement contract (E1 escrow) as a
  `is_allowed` call before release. That needs the escrow redeploy, so the on-chain
  half is deferred; the app-side gate and interface land now.

## Deferred (needs a redeploy or external partners)

### Contract hardening (Wave 3, one deliberate redeploy)
- M1: a `__constructor(admin, vk, vk_payroll)` plus admin `require_auth` on the
  setters, reject duplicate commitments, assert canonical field elements.
- M2: company co-signature on `anchor_with_range`.
- R6-M1: give the employer signing key its own secret, decoupled from the company
  viewing key (today it is derived from it, which is sound but couples two secrets).
- Why deferred: all three require redeploying live contracts and re-seeding. Not a
  deadline-day operation. The findings are documented in the internal audit and are
  honest-flow or defense-in-depth, not live exploits.

### Atomic verify-and-release escrow (E1)
- Release USDC only when a valid proof binds to the anchored recipient, replay
  rejected. This single design closes the honest-flow limits (H1, M3, M4): it binds
  the real on-chain recipient, validates the transfer, and turns the coverage flag
  into a real reserve. The big day-after item.

### Scale and limits
- A2: scale the aggregate width N. First confirm Soroban exposes a Poseidon host
  function, then use an in-circuit Poseidon sum-tree with an on-chain root recompute.
- E5: a public payout cap in the payroll circuit (`sum <= budget`).

### Strategic bets (not scheduled)
- A3 confidential balance, E3 multi-currency and tax, E6 SDK / npm package,
  B-gold in-circuit auditor key, F4 eSocial / DIRF (gated on the CLT crypto-salary
  law).

## Honest limitations (carried forward)

- The recipient and the fact of payment are public on Stellar. The amount is
  private (commitment plus range proof). This is selective privacy, not a shielded
  pool.
- The worker-cosigned range and the aggregate line binding protect the honest
  payment flow. A company crafting raw contract calls with a mismatched identity
  hash can still bypass range enforcement. Binding the real on-chain recipient to the
  anchored identity (E1) closes this and is roadmap.
- Treasury coverage is a point-in-time snapshot, not an escrowed reserve (E1).
- Employer attestation in F1 proves that some key signed the records. Binding that
  key to a named company on-chain (an employer registry) is roadmap.
