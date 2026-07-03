# ShieldPay: Architecture

ShieldPay is confidential payroll for DAOs and Web3 teams on Stellar. It pays
contributors in USDC, keeps each amount private with a zero-knowledge range proof
verified inside a Soroban contract, posts a real on-chain settlement bound to the
proof, and lets the company disclose exact amounts to an authorized auditor under
a viewing key. The recipient of each payment is visible; only the amount is hidden.

On top of the per-payment layer sits the headline innovation, Proof-of-Payroll: a
single aggregate proof over an entire run that proves the amounts sum to a public
total and that each one sits inside its agreed range, revealing no individual
salary. Think of it as proof-of-reserves, for payroll.

## The proof and settlement chain

```
┌─────────────────────────────────────────────────────────────┐
│  RECEIPT AND DISCLOSURE (off-chain)                          │
│  Verifiable receipt PDF. Viewing-key disclosure reveals and   │
│  re-verifies exact amounts against the on-chain commitments.  │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│  PROOF-OF-PAYROLL, AGGREGATE (Soroban: payroll verifier)     │
│  One Groth16 proof over the whole run: sum of amounts equals   │
│  a public total AND each amount is in range. No individual     │
│  salary revealed. Records a PayrollRecord. Separate verifier   │
│  instance initialized with the payroll VK.                    │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│  ZK PROOF, PER PAYMENT (Soroban: PaymentVerifier)            │
│  Groth16 proof: amount within the contractual range. Verified  │
│  on-chain. The exact amount is never revealed. Bound to the    │
│  settlement transaction hash.                                  │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│  SETTLEMENT (Stellar classic)                                │
│  Recipient-visible, memo-bound record to the worker address.   │
│  Symbolic amount. The salary stays the commitment.            │
│  Memo SHIELDPAY|PAY|v1|...                                    │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│  IDENTITY ANCHOR (Soroban: AnchorRegistry)                   │
│  Worker self-anchors their address with contract metadata.     │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│  ORGANIZATION AND INVITE (off-chain)                         │
│  Company setup and seedless onboarding via Privy.             │
└─────────────────────────────────────────────────────────────┘
```

## Where ZK is essential

The hackathon requires ZK to drive a real part of the system, not decorate a
slide. In ShieldPay the ZK proof is load-bearing: the product proves that a
payment fell inside the agreed range `[min, max]` without disclosing the
commercially sensitive exact amount. Remove the proof and the core promise of
verifiable privacy collapses.

- **Statement:** `min <= value <= max` and `Poseidon(value, r) == commitment`
- **System:** Groth16 (zk-SNARK), Circom toolchain, BN254 curve
- **Verification:** real on-chain pairing check in the `PaymentVerifier` Soroban
  contract using Stellar's native BN254 host functions (Protocol 25 and 26),
  exposed via `soroban_sdk::crypto::bn254`. Verified on testnet: a valid proof
  records; a proof with wrong public signals is rejected with `InvalidProof`.

## Proof-of-Payroll (the aggregate proof)

The per-payment layer proves each amount is in range one payment at a time. The
Proof-of-Payroll layer proves a whole run at once. After a payroll run, the server
generates a single Groth16 proof that attests two things together: the sum of all
amounts equals a public total, and each amount is inside its own agreed range. No
individual salary is revealed. The public total is the one figure the company is
willing to disclose (for example, "this DAO paid $42,000 to contributors this
month"), while the split across people stays private.

- **Circuit:** `circuits/payroll_proof/payroll_proof.circom`, fixed width `N = 8`.
  Short runs are padded with zeros so the circuit shape is constant.
- **Public signals (25):** `commitment[8]`, `minValue[8]`, `maxValue[8]`, `total`.
- **Private inputs:** `value[8]`, `randomness[8]`.
- **Off-chain prover:** `lib/zk/payroll-prover.ts` (snarkjs), reusing the field
  encoding in `lib/zk/encode.ts`.
- **On-chain method:** `verify_and_record_payroll` in `contracts/payment_verifier`
  records a `PayrollRecord` and binds the recorded total to the proof's last
  public signal.
- **Deployment:** one unified instance of the `PaymentVerifier` contract whose
  constructor stores both verification keys at deploy time (per-payment and
  payroll), so a single instance verifies both. Live on Stellar testnet at
  `CC2LBLFIXG3BUPS436E4MYCDJ36DB2AX66IZIWBE2VVMU4M4C4TTIYCQ` (the Wave 3 hardened
  instance, re-validated on testnet: proof_id 0 recorded, forged and replay
  rejected). All 25 public signals verify within the Soroban compute budget.

**On-chain binding and honest limits.** The payroll verifier now binds every
non-padding line to a recorded per-payment proof of the same company with a
matching range (a commitment -> record index plus the range stored in each record),
so a company cannot aggregate with invented lines or ranges. It also records a
point-in-time treasury-coverage flag read from the USDC balance on-chain. Where we
do not overclaim: the worker-cosigned range enforcement protects the honest payment
flow but is bypassable by a company crafting raw calls (a mismatched identity
hash), coverage is a snapshot rather than an escrowed reserve, and the proof does
not validate the USDC transfer itself. Binding the real recipient and settlement to
the anchored identity on-chain (atomic verify-and-release) is the roadmap step that
closes these.

## Selective disclosure (the viewing key)

The chain and the public auditor view only ever see the commitment and the range.
The company holds a per-company viewing key. With it, an authorized auditor can
open each payment's sealed witness `{amount, randomness}`, recompute
`Poseidon(amount, randomness)`, and confirm it matches the on-chain commitment.
The witness is sealed with AES-256-GCM, with the key derived from the viewing key
through HKDF-SHA256. This makes disclosure provable rather than a matter of trust.

## Component map

| Component | Tech | Path |
| --- | --- | --- |
| Web app (3 portals and API) | Next.js 14, TS, Tailwind | `app/`, `lib/` |
| Identity anchor contract | Rust, soroban-sdk 26 | `contracts/anchor_registry` |
| ZK verifier contract | Rust, soroban-sdk 26 | `contracts/payment_verifier` |
| ZK circuit (per payment) | Circom and Groth16 | `circuits/payment_proof` |
| ZK circuit (aggregate, Proof-of-Payroll) | Circom and Groth16 | `circuits/payroll_proof` |
| ZK circuit (reference) | Noir | `circuits/noir_reference` |
| Off-chain proof generation | snarkjs (pure JS) | `lib/zk/prover.ts`, `lib/zk/payroll-prover.ts` |
| Commitment and disclosure | Poseidon, AES-256-GCM | `lib/zk/commitment.ts`, `lib/zk/disclosure.ts` |
| Database | Postgres (Railway) | `lib/db/schema.ts` |

## Payment flow

1. **Onboarding.** The company invites a contributor. The contributor accepts
   through a Privy embedded wallet, provides identity, and signs an on-chain
   self-anchor (`AnchorRegistry.anchor`).
2. **Confidential payroll run.** The company submits a batch run. For each line
   the server commits to the amount, generates a Groth16 proof off-chain, posts a
   recipient-visible settlement, and calls `PaymentVerifier.verify_and_record`
   with the proof bound to the settlement transaction hash. When a viewing key is
   present, the witness is sealed for later disclosure.
3. **Proof-of-Payroll.** For the run as a whole, the server generates one
   aggregate Groth16 proof and calls `verify_and_record_payroll` on the separate
   payroll verifier instance, recording a `PayrollRecord` bound to the public total.
4. **Receipt.** Once verified on-chain, the server renders the verifiable PDF.
5. **Disclosure.** The company mints a read-only auditor link, or a viewing-key
   link that reveals exact amounts and re-verifies them against the commitments.

### Non-custodial signing path

Signing is abstracted behind a `CompanySigner` interface. `ServerSigner` uses a
server-held testnet key (the demo-safe custodial fallback); `BrowserSigner` has
the company's own Privy wallet sign client-side, so no key leaves the browser. The
run is split into two API steps: `/api/payroll/prepare` (the server generates all
proofs, holding no key) and `/api/payroll/record` (confirms each proof on-chain,
then persists). `NEXT_PUBLIC_` contract ids expose the contract addresses needed
for client-side calls.

## Decisions and honest status

- **Decision 1, Groth16 over UltraHonk.** UltraHonk on Soroban is currently
  localnet-only and over the testnet compute budget. Groth16 verifies on testnet
  today and is one of the officially endorsed paths. Noir is kept as a readable
  reference.
- **Decision 2, range proof, not amount hiding.** The settlement itself is public
  on Stellar. The ZK proof hides the exact amount, proving only range membership.
  The recipient is visible by design.
- **Decision 3, settlement record, not real-USDC transfer.** Moving the real
  amount on a transparent chain would leak it. The settlement is a real record
  with a symbolic amount, and the salary stays the commitment. Real-USDC fund
  rails are a documented decision for mainnet.
- **On-chain verification is real.** `payment_verifier` runs the full Groth16 and
  BN254 pairing check on-chain via `soroban_sdk::crypto::bn254`
  (`e(-A,B)·e(α,β)·e(vk_x,γ)·e(C,δ) == 1`). We use BN254 to match Circom and
  snarkjs, not the BLS12-381 of the official BLS example. snarkjs artifacts are
  converted to the on-chain byte layout by
  `circuits/scripts/encode_bn254_for_soroban.mjs` (G2 needs c1-before-c0 Fp2
  ordering).
- **Demo signing.** For the hackathon the company signs server-side from a funded
  testnet key. Production uses a wallet signature flow.

## Toolchain versions (verified June 2026)

| Tool | Version | Note |
| --- | --- | --- |
| Node | 22 | see `.nvmrc` |
| `@stellar/stellar-sdk` | 15.x | Soroban RPC under the `rpc` namespace |
| `soroban-sdk` | 26 | tracks the protocol number |
| `stellar-cli` | 26.x | binary is `stellar`, not `soroban` |
| build target | `wasm32v1-none` | not `wasm32-unknown-unknown` |
| Circom | 2.1.x | with snarkjs and circomlib |
