# ShieldPay Roadmap

Where the product is, what is scaffolded but not finished, and what is deliberately
deferred. Written to be honest: shipped means built, tested, and (for on-chain work)
validated on testnet. Base means the structure and contracts exist but a full
production path (usually an external integration or a contract redeploy) is not done
yet. Deferred means designed and documented but not started.

Last updated: 2026-07-08.

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

### Contract hardening (Wave 3), shipped and redeployed
- M1: `__constructor(admin, vk, vk_payroll)` (no post-deploy initialize), admin
  `require_auth` on the setters, reject a duplicate commitment (DuplicateCommitment),
  reject non-canonical field elements (NonCanonicalInput). Done.
- M2: company co-signature on `anchor_with_range`, plus the range is write-once per
  (worker hash, company) so a company cannot overwrite a worker's range (the H1
  adversarial finding). The app and the seed carry the two-party auth. Done.
- R6-M1: the employer signing key derives from its own per-company seed, decoupled
  from the viewing key. Done.
- Redeployed to fresh testnet instances (verifier CC2LBLFI, anchor CAFFQPDF) and
  validated on-chain: real proof recorded, forged and replay rejected, two-party
  anchor confirmed, admin-gated setters. See SECURITY_AUDIT round 7 (internal).
- Residual, honestly noted: the write-once guard blocks the range overwrite, but a
  company front-running a worker's very first anchor is closed only by on-chain
  recipient binding (E1 below).

## Deferred (needs a redeploy or external partners)

### Atomic verify-and-release escrow (E1)
- Release USDC only when a valid proof binds to the anchored recipient, replay
  rejected. This single design closes the honest-flow limits (H1, M3, M4): it binds
  the real on-chain recipient, validates the transfer, and turns the coverage flag
  into a real reserve. The big day-after item.

### Scale and limits
- A2: scale the aggregate width N. Build a run as a Merkle tree of the per-line
  commitments and prove the root plus the total in one aggregate proof, so a run
  scales to 128+ recipients with a single on-chain root instead of the current
  small fixed width. Confirm Soroban exposes a Poseidon host function first, then
  recompute the root on-chain; the per-line aggregate binding stays.
- E5: a public payout cap in the payroll circuit (`sum <= budget`).

### Strategic bets (not scheduled)
- E6 SDK / npm package, B-gold in-circuit auditor key, F4 eSocial / DIRF (gated on
  the CLT crypto-salary law).

### Product next wave (funding, currency, privacy tier, disclosure)

Grouped follow-ups that turn the testnet product into something a real company can
run on mainnet. Each is scoped so it can land independently.

- Client-side proving. Move witness proof generation into the browser (a Rust to
  WebAssembly prover, or snarkjs WASM) so the salary plaintext and the randomness
  never reach the server at all. Today the server generates the proof, which means
  the witness is trusted to the server for the prove step; browser proving removes
  that trust boundary and is the stronger privacy story. Pairs with a trusted-setup
  ceremony (the Groth16 keys must come from a real multi-party ceremony before
  mainnet, not a dev setup).
- Fee sponsorship (mainnet funding). A brand-new non-custodial recipient holds no
  XLM, so on mainnet their account cannot exist or pay a fee (testnet leans on the
  friendbot faucet). Sponsor the account reserve (sponsored reserves) and pay the
  fee with a fee-bump, so the contributor signs but never needs XLM. A per-company
  `feeSponsor: platform | company` setting (default platform, admin-changeable, and
  reversible per transaction since sponsorship is per-tx) chooses who pays.
- Multi-stablecoin settlement, company chooses (expands E3). A per-company
  `settlementAsset` (USDC, EURC, a BRL stablecoin), curated by real Stellar
  liquidity, one asset per run. The ZK is unchanged: the circuit proves amount in
  range and is unit-agnostic, so this touches only the payment rail, trustlines,
  and display. A run may optionally carry more than one asset per line, behind a
  per-company token registry.
- Shielded payout mode, optional recipient privacy (the concrete form of A3). An
  opt-in second privacy tier: instead of a direct recipient-bound transfer, the
  payout funds a pooled note and the contributor withdraws with a zero-knowledge
  proof (a Merkle tree of note commitments, a per-note nullifier to block double
  spend, an accepted-roots list on-chain), so the recipient and the payment linkage
  are hidden, not only the amount. It complements, and does not replace, the default
  auditable mode that binds the recipient for court and compliance: the company
  chooses per run or per contributor between "bound and provable" and "shielded and
  private" (sensitive contributors, cross-border). Needs a withdraw circuit and a
  pool contract, and would close the recipient-privacy limitation below. It is the
  withdraw half of the E1 escrow, escrow the funds on the run, release them on a
  valid withdraw proof, so E1 and this mode ship as one construction. A compliant
  version gates deposits through an association-set membership / non-membership
  proof, so illicit funds are excludable from the pool without breaking any
  individual's privacy (the standard way to keep a privacy pool auditable).
- Encrypted metadata vault plus scoped audit tokens. Beyond sealing the amount under
  the viewing key, encrypt the full per-payment metadata payload at rest (AES-GCM)
  and issue an auditor a scoped, revocable token (stored as a hash, one-time or
  time-boxed) that decrypts exactly the slice they are entitled to. Deepens the
  auditor portal from "ranges plus on-chain proofs" to a bounded, encrypted detail
  set, without exposing the whole book. The encrypted blobs may live off-chain
  (e.g. IPFS), referenced by content id on-chain, so the ledger holds only the
  pointer.
- Public per-artifact verify pages. A wallet-free public page for a single payment
  proof and for a whole payroll run, resolving the proof id straight from the
  contract (verified, total, range), shareable with a bank, court, or auditor.
  Extends the landing verify panel and the proof-of-income page to both artifacts.
- Contributor money movement. In the contributor portal: wallet balance, a receive
  address and QR, and a cash-out path to Stellar off-ramps (SEP-24 / SEP-6 anchors).
  A spendable stablecoin card via a card-issuing / BaaS partner is a later,
  partner-gated step and depends on KYC.
- Contributor invoice / fiscal linkage. Reuse the F3 `fiscal_link` base so a
  contributor attaches a monthly invoice reference to a received payment, giving the
  company an auditable book. A concrete municipal or provider adapter stays the
  external dependency.
- KYC / compliance provider (the on-chain half of E2). Wire a sanctions and KYC
  provider (document plus liveness) as the compliance gate before a payment, and
  move the gate into the settlement contract (E1 escrow) as an `is_allowed` check.
  Enables the card and regulated payouts.

### Internationalization, PT-BR and EN (planned, no contract work)
- Add PT-BR alongside EN with a language switcher. Chosen approach: `next-intl` in
  cookie mode (no URL prefix), so the default-deny path-prefix middleware and the
  (company) / (worker) / (auditor) route groups stay untouched. Server Components
  read strings with `getTranslations()`, client with `useTranslations()`, from
  centralized `messages/{en,pt}.json`. Picked over react-i18next / React Context
  (client-only; would force most pages to `'use client'`, against the server-first
  architecture). Same library both Next apps in the org use (streak: cookie,
  passexplorer: URL prefix). Rollout is incremental (public pages first, then chrome,
  then the portals). On-chain data (proof ids, hashes, Stellar addresses, amounts,
  memos, contract ids) is never translated; currency and dates become locale-aware.
  Legal and court-receipt copy needs human-reviewed translation, EN stays canonical.
  Full plan and file layout: `temp/i18n-plan.md`.

## Honest limitations (carried forward)

- The recipient and the fact of payment are public on Stellar by default. The
  amount is private (commitment plus range proof). This is selective privacy, and
  it is deliberate: the default mode binds the recipient so the payment is provable
  in court and to an auditor. The optional shielded payout mode above hides the
  recipient too, for contexts where privacy outweighs provability, and is roadmap.
- The worker-cosigned range and the aggregate line binding protect the honest
  payment flow. A company crafting raw contract calls with a mismatched identity
  hash can still bypass range enforcement. Binding the real on-chain recipient to the
  anchored identity (E1) closes this and is roadmap.
- Treasury coverage is a point-in-time snapshot, not an escrowed reserve (E1).
- Employer attestation in F1 proves that some key signed the records. Binding that
  key to a named company on-chain (an employer registry) is roadmap.
