# ShieldPay — Architecture

ShieldPay turns a crypto payment into **court-grade, mathematically verifiable
proof of payment**. It does this by chaining five layers of evidence, two of
which live on Stellar/Soroban.

## The five-layer proof chain

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5 — LEGAL DOCUMENT (off-chain)                        │
│  Auto-generated PDF binding the whole trail in plain language │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│  LAYER 4 — ZK PROOF (Soroban: PaymentVerifier)               │
│  Groth16 proof: "amount within contractual range" — verified   │
│  on-chain, exact amount never revealed                          │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│  LAYER 3 — PAYMENT (Stellar classic)                         │
│  USDC -> worker address, memo SHIELDPAY|PAY|v1|...             │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│  LAYER 2 — IDENTITY ANCHOR (Soroban: AnchorRegistry)         │
│  Worker self-anchors address <-> cpf_hash + contract           │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│  LAYER 1 — CONTRACT (off-chain)                              │
│  Digitally signed service agreement; declares Stellar address  │
└─────────────────────────────────────────────────────────────┘
```

## Where ZK is essential

The hackathon requires ZK to drive a real part of the system, not decorate a
slide. In ShieldPay, **Layer 4 is load-bearing**: the legal value of the receipt
depends on a proof that the payment fell inside the agreed range
`[min, max]` — letting a company prove compliance to a judge or auditor
**without disclosing the commercially sensitive exact salary**. Remove the ZK
proof and the product's core promise (selective privacy + provability)
collapses.

- **Statement:** `min ≤ value ≤ max` ∧ `Poseidon(value, r) == commitment`
- **System:** Groth16 (zk-SNARK), Circom toolchain
- **Verification:** on-chain in the `PaymentVerifier` Soroban contract using
  Stellar's native BLS12-381 host functions (Protocol 23+).

## Component map

| Component | Tech | Path |
| --- | --- | --- |
| Web app (3 portals + API) | Next.js 14, TS, Tailwind | `app/`, `lib/` |
| Identity anchor contract | Rust, soroban-sdk 26 | `contracts/anchor_registry` |
| ZK verifier contract | Rust, soroban-sdk 26 | `contracts/payment_verifier` |
| ZK circuit (primary) | Circom + Groth16 | `circuits/payment_proof` |
| ZK circuit (reference) | Noir | `circuits/noir_reference` |
| Off-chain proof generation | snarkjs (pure JS) | `lib/zk/prover.ts` |
| Database | Postgres (Railway) | `lib/db/schema.ts` |

## Payment flow

1. **Onboarding** — company invites worker; worker signs the contract and
   self-anchors their address (`AnchorRegistry.anchor`).
2. **Payout** — CFO uploads a CSV; for each row the server (a) checks the
   address is anchored, (b) generates a Groth16 proof off-chain, (c) sends USDC
   with the structured memo, (d) calls `PaymentVerifier.verify_and_record`.
3. **Receipt** — once verified on-chain, the server renders the court-grade PDF.
4. **Portals** — worker views/downloads receipts; auditor gets a read-only,
   time-boxed link.

## Decisions & honest status (work-in-progress)

- **Decision 1 — Groth16 over UltraHonk.** UltraHonk on Soroban is currently
  localnet-only and ~5–6× over the testnet compute budget; the Protocol 26
  precompile integration that would fix it is an unfinished stretch goal.
  Groth16 verifies on testnet today and is one of the three officially endorsed
  paths. Noir is kept as a readable reference.
- **Decision 2 — range proof, not amount hiding.** The transaction itself is
  public on Stellar; ZK hides the *exact* amount, proving only range membership.
- **Verifier seam.** `payment_verifier::verify_groth16` is a guarded stub today
  so storage/auth/indexing are fully testable; wiring the BLS12-381
  host-function pairing check (per the official `groth16_verifier` example) is
  the Day 1–2 milestone. Stated plainly per the hackathon's "honest
  work-in-progress over polished mystery" guidance.
- **Demo signing.** For the hackathon, the company signs payments server-side
  from a funded testnet key; production uses a Freighter wallet signature flow.

## Toolchain versions (verified June 2026)

| Tool | Version | Note |
| --- | --- | --- |
| `@stellar/stellar-sdk` | 15.x | Soroban RPC under `rpc` namespace |
| `soroban-sdk` | 26 | tracks protocol number |
| `stellar-cli` | 26.x | binary is `stellar`, not `soroban` |
| build target | `wasm32v1-none` | not `wasm32-unknown-unknown` |
| Circom | 2.1.x | + snarkjs, circomlib |
