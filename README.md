<div align="center">

# 🛡️ ShieldPay

### On-chain payroll publishes every salary. A rival reads the ledger and poaches your best engineer with the number in hand.

#### ShieldPay: confidential payroll on Stellar. Proof-of-reserves, for payroll.

**Settle contributor payments on Stellar and prove on-chain that each one was correct, while keeping the amount private and disclosing the exact figure only to an authorized auditor.**

[![Stellar](https://img.shields.io/badge/Stellar-Protocol%2026-7D00FF?logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-soroban--sdk%2026-08B5A5)](https://developers.stellar.org/docs/build/smart-contracts/overview)
[![ZK](https://img.shields.io/badge/ZK-Groth16%20zk--SNARK-6366F1)](https://docs.circom.io/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981.svg)](LICENSE)
[![CI](https://github.com/deegalabs/shieldpay/actions/workflows/ci.yml/badge.svg)](https://github.com/deegalabs/shieldpay/actions/workflows/ci.yml)

Submission for **Stellar Hacks: ZK** · Real-world ZK on Stellar

ShieldPay builds the hackathon's "confidential payroll" idea: pay a team in
stablecoins with each amount private on-chain, while the company can still prove
totals to an auditor. The ZK is load-bearing: a Groth16 proof is verified inside
a Soroban smart contract with Stellar's native BN254 pairing, not namechecked.

</div>

---

## Demo

A short walkthrough of the product, from confidential payroll to a private,
independently verifiable receipt.

- **Live app:** https://web-production-f389ce.up.railway.app
- **Pitch video:** [Watch on YouTube](https://www.youtube.com/watch?v=frtzjAtgiaY)

> The one-click demo login (Company / Contractor on the sign-in screen) runs on an
> isolated demo identity, so it never touches the treasury-owning account.

## Why we built this

On-chain payroll leaks every salary on a transparent ledger: anyone can read what
each contributor earns. A company should be able to prove it paid its team
correctly, in range and on total, without publishing the numbers. That is exactly
a zero-knowledge statement, so we built it.

## The problem

A DAO or a Web3 team wants to pay its contributors on-chain, but payroll amounts
are sensitive. On a transparent chain, putting the salary in the operation amount
publishes it to the whole world. The team needs a payment that settles for real,
proves it was correct, and still keeps the figure private, while remaining
auditable when an accountant or a partner needs to check the numbers.

## The solution

ShieldPay runs payroll on Stellar with USDC as the payout rail. Each amount is
kept as a Poseidon commitment with a zero-knowledge range proof that is verified
inside a Soroban smart contract. The payment posts a real, recipient-visible,
memo-bound settlement on-chain, bound to the proof, without printing the salary
in clear. The settlement amount is a fixed, symbolic marker, not the salary,
because moving the real figure in clear would leak it on a transparent chain.
The company holds a viewing key that lets an authorized auditor reveal the exact
amounts and re-verify them against the on-chain commitments.

The privacy model is deliberate: **recipient visible, amount hidden.** Private by
default, auditable on demand.

## The innovation: Proof-of-Payroll

Hiding one amount with a range proof is well-trodden. ShieldPay goes further and
proves the **whole run at once**. After a payroll run, a single zero-knowledge
proof attests, on-chain, that:

- the sum of every (hidden) amount equals a public total, and
- each amount is within its agreed range,

revealing no individual salary. It is **proof-of-reserves, for payroll**: a
company can hand a DAO, an investor, or a regulator one on-chain-verifiable proof
that "we paid exactly $X in total and everyone was paid within contract," without
leaking a single number. The headline claim stops being a promise and becomes
math anyone can check.

This is the ZK doing real, load-bearing work. The aggregate Groth16 proof (Circom
/ BN254, in `circuits/payroll_proof/payroll_proof.circom`) is verified inside a
Soroban smart contract via Stellar's native BN254 pairing (Protocol 25/26), in
`verify_and_record_payroll`. It is **live on testnet**, and the 25 public signals
verify within the Soroban budget:

- Verifier (holds both circuit keys): `CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q`
- A verified aggregate proof (total proven, salaries hidden):
  [tx 33c78362…](https://stellar.expert/explorer/testnet/tx/33c783629d345c864175d511873f195595c90e3f276a3aba81b0fe99d7aa336b)

**What it proves today, honestly.** The aggregate now binds each line to a real,
individually verified payment: the contract holds a commitment -> record index and
rejects a run unless every non-padding line matches a recorded per-payment proof
of the same company with a matching range. A company can no longer aggregate with
invented lines or ranges that diverge from the recorded payments. This is verified
on-chain (a widened-range aggregate is rejected with `ProofNotBound`) and by
contract tests. It also records a point-in-time treasury-coverage flag read from
the USDC balance on-chain.

Where we are still upfront about the limits, rather than overclaim:

- **Worker-cosigned ranges enforce the honest payment flow, not an adversary.**
  The worker co-signs their agreed range at anchor time and the verifier enforces
  it, so the app cannot pay outside the agreed range. A company crafting raw
  contract calls could still bypass it (by proving against a mismatched identity
  hash the registry has no range for). Making it adversarial-proof requires binding
  the actual on-chain USDC recipient to the anchored identity, which is roadmap.
- **Treasury coverage is a point-in-time snapshot,** read at verification time, not
  an escrowed reserve guarantee.
- **The on-chain proof does not validate the USDC transfer itself** (recipient or
  amount); it binds a settlement tx hash. Validating the settlement on-chain
  (atomic verify-and-release) is the roadmap step that would close this.

## How the ZK is load-bearing

Remove the proof and there is nothing left to stand on: the amount either goes
on-chain in clear and every salary is exposed, or it goes off-chain and there is
no evidence the payment was correct. The zero-knowledge proof is the one thing
that lets the amount stay a commitment while its correctness stays checkable by
anyone. It is not a feature bolted onto a payments app. The proof is the product.

## Why ZK is essential here

ZK is load-bearing, not decoration. The core promise is "prove the payment was
correct without disclosing the salary," which is exactly a zero-knowledge
statement:

```
public:   valueCommitment, minValue, maxValue
private:  value, randomness

prove:    min <= value <= max  and  Poseidon(value, randomness) == valueCommitment
```

- **Proof system:** Groth16 (zk-SNARK), Circom and snarkjs toolchain, BN254 curve.
  Groth16 is one of the officially endorsed Stellar ZK paths and the one that
  fits the Soroban verification budget on testnet today.
- **Verified on-chain** in the `PaymentVerifier` Soroban contract using Stellar's
  native BN254 host functions (Protocol 25 and 26), exposed through
  `soroban_sdk::crypto::bn254`. A valid proof records; a proof with wrong public
  signals is rejected with `InvalidProof`.

We chose Groth16 over Noir and UltraHonk because UltraHonk verification currently
exceeds the testnet compute budget. A readable Noir reference of the same circuit
lives in [`circuits/noir_reference`](circuits/noir_reference). The full rationale
is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### Measured performance

Numbers measured from this repo. Both circuits are Groth16 over BN254 (Circom and
snarkjs), verified inside Soroban with the native BN254 host functions.

| | Per-payment | Aggregate (Proof-of-Payroll, N=8) |
| --- | --- | --- |
| Proof size | 256 bytes | 256 bytes |
| Public signals | 5 | 25 |
| Constraints | 593 | 4736 |
| Verification key | 836 bytes | 2116 bytes |
| On-chain cost | one 4-pairing check + 5 BN254 scalar-muls | one 4-pairing check + 25 BN254 scalar-muls |

All signals verify within the Soroban compute budget. Proving runs with snarkjs in
Node (proving time not benchmarked).

## The proof and settlement chain

| Layer | What | Where |
| --- | --- | --- |
| Receipt and disclosure | Verifiable receipt PDF, plus the viewing-key disclosure | Off-chain |
| Proof-of-Payroll (aggregate) | One proof that the run's total is correct and every amount is in range, no salary revealed | Soroban, payroll `PaymentVerifier` |
| ZK proof (per payment) | Groth16 proof of in-range payment, bound to the settlement | Soroban, `PaymentVerifier` |
| Settlement | Recipient-visible, memo-bound on-chain record (symbolic amount) | Stellar classic |
| Identity anchor | Worker self-anchors their address and contract metadata | Soroban, `AnchorRegistry` |
| Organization and invite | Company setup and seedless onboarding | Off-chain |

The exact amount stays a commitment at every public layer. Full diagram and flow
in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Rejection paths (what the chain refuses)

Each guarantee maps to a real on-chain error in the `PaymentVerifier` contract.
The chain does not take our word for it, it rejects anything that does not hold.

| Guarantee | Mechanism | On-chain rejection |
| --- | --- | --- |
| A forged proof cannot be recorded | BN254 pairing check | `InvalidProof` (#3) |
| A payment cannot be replayed | tx-hash / run-ref dedup | `DuplicatePayment` (#4) |
| A proof cannot be rebound to another recipient, commitment, or tx | signals 0/3/4 bound to the record | `ProofNotBound` (#8) |
| An aggregate line must be a real recorded payment with a matching range | commitment to record index plus stored range | `ProofNotBound` (#8) |

Reproduce these live with `pnpm demo`: it records a real proof, then a forged one
and a replayed one are rejected on-chain.

## Privacy model

- **Public and on-chain:** who paid whom (recipient visible by design, for
  compliance and AML), the agreed range, the commitment, the proof, and the
  settlement transaction. Never the amount.
- **Company:** holds a per-company viewing key, sees its own totals and amounts.
- **Auditor with the viewing key:** reveals the exact amounts and re-verifies them
  against the on-chain commitments, so it is provable rather than trusting a
  spreadsheet.

We do not move the real USDC salary amount in the settlement, because a real
transfer of that amount would publish it in the operation. The settlement is a
real record with a symbolic amount, and real-USDC fund rails are a documented
decision for mainnet.

## How it compares

| | Raw USDC payroll | Shielded wallet | ShieldPay |
| --- | --- | --- | --- |
| Amount private | no | yes | yes |
| Recipient visible / auditable | yes | no | yes |
| Provably correct on-chain | no | partial | yes |
| Selective disclosure to an auditor | no | rare | yes |
| One aggregate proof for a whole run | no | no | yes |

## Tech stack

| Layer | Technology |
| --- | --- |
| Web (3 portals and API) | Next.js 14 (App Router), TypeScript, Tailwind |
| Smart contracts | Rust, `soroban-sdk` 26, target `wasm32v1-none` |
| ZK circuit (primary) | Circom 2 and Groth16 (snarkjs) |
| ZK circuit (reference) | Noir |
| Proof generation | snarkjs (pure JS, runs anywhere including Railway) |
| Commitment and disclosure | Poseidon commitment, AES-256-GCM disclosure sealing |
| Stellar integration | `@stellar/stellar-sdk` 15 (`rpc` namespace) |
| Database | PostgreSQL (Railway) |
| Auth | jose JWT sessions and RBAC middleware, Privy seedless login |
| Deploy | Railway (app), Stellar testnet (contracts) |

## Quickstart

```bash
# 0. prerequisites: Node 22, pnpm, Rust and stellar-cli, circom and snarkjs
bash scripts/setup.sh           # installs JS deps, prints a toolchain checklist

# 1. configure
cp .env.example .env.local      # fill in values

# 2. build the ZK circuit and trusted setup
pnpm zk:setup

# 3. deploy contracts to testnet (writes contracts/deploy/addresses.json)
pnpm contracts:deploy

# 4. run the app
pnpm dev                        # http://localhost:3000
```

End-to-end ZK smoke test (after `zk:setup`):

```bash
pnpm zk:prove -- --value 50000 --min 45000 --max 55000   # in-range proof passes
```

## Project structure

```
shieldpay/
├── app/              Next.js: landing, 3 portals (company / worker / auditor), API
├── lib/              Stellar client, ZK prover, disclosure, PDF receipts, DB
├── contracts/        Soroban (Rust): anchor_registry, payment_verifier
├── circuits/         ZK: Circom payment_proof + payroll_proof (Groth16), Noir (reference)
├── scripts/          setup / seed / cleanup / e2e flow
└── docs/             ARCHITECTURE · PITCH · DEMO_SCRIPT · RUNBOOK · USE_CASES · LEGAL
```

The design system (color, typography, the shield mark, component patterns) lives
in [`.design/branding/shieldpay/`](.design/branding/shieldpay).

## Authentication

Seedless login through Privy (email, Google, or passkey), which creates a Stellar
account for the user, so payroll and accounting users never touch a seed phrase.
A one-click demo login is available for evaluation. Auditors get a signed,
expiring read-only link, with no wallet needed. Sessions are signed JWTs, and
routes are role-gated by middleware.

## Multi-tenant SaaS spine

Under the ZK, ShieldPay is a real multi-tenant application. The security
primitives are already in the code:

- JWT sessions (jose), signed and role-scoped.
- Default-deny middleware: a route stays closed unless a role opens it.
- zod-validated inputs on every API route.
- Parameterized SQL only, never string-concatenated queries.
- Rate limiting on sensitive endpoints.
- Per-company data scoping, so one tenant never reads another tenant's data.
- The exact amount is never stored in clear, only the commitment and the range.

## The three portals

- **Company.** Organization setup, dashboard, contractor invite and management,
  confidential payroll runs, receipts, settings, and two auditor links
  (read-only and viewing-key).
- **Worker.** Seedless login, history scoped to their address, recipient-visible
  settlement link, and receipt download.
- **Auditor.** Signed expiring link with no wallet. Read-only shows ranges and
  proofs. The viewing-key link reveals exact amounts, re-verified against the
  commitments, with a reconciled total and CSV export.

Design rule: cryptography is invisible. Plain-language UI and a Help Center at
[`/help`](https://web-production-f389ce.up.railway.app/help) translate the ZK
concepts for non-technical users.

## Status

A working, deployed product on Stellar testnet. The full flow from invite to
onboarding and on-chain anchor, confidential payroll run, on-chain proof and
settlement, selective disclosure, and receipt is built and validated on testnet.

- Real on-chain Groth16 and BN254 proof verification in `PaymentVerifier` via
  `soroban_sdk::crypto::bn254`. A valid proof records; a tampered proof is
  rejected.
- Off-chain prover (Circom and snarkjs) with a trusted-setup pipeline.
- Soroban contracts (`AnchorRegistry`, `PaymentVerifier`) deployed to testnet.
- Confidential payroll runs with a per-payment commitment and a run total.
- Aggregate Proof-of-Payroll: one on-chain proof per run that the total is
  correct and every amount is within its agreed range, revealing no salary,
  verified live on testnet (25 public signals within the Soroban budget).
- Non-custodial signing option: the company can sign its own on-chain calls with
  its Privy wallet (the server never holds the key), with a custodial fallback.
- Selective disclosure with AES-256-GCM sealing, re-verified against the
  on-chain commitment.
- Real, recipient-visible, memo-bound settlement record, with the proof bound to
  the settlement transaction hash.
- Postgres persistence on Railway, scoped per company, with the exact amount
  never stored in clear.

Honest limitations:

- The worker-cosigned range enforcement and the treasury-coverage flag protect the
  honest payment flow, but are not adversarial-proof on-chain: a company crafting
  raw contract calls could bypass the range check (a mismatched identity hash the
  registry has no range for), and coverage is a point-in-time snapshot, not an
  escrowed reserve. The on-chain proof also does not validate the USDC transfer
  itself, only a settlement tx hash. Binding the real recipient/settlement to the
  anchored identity on-chain (atomic verify-and-release) is the roadmap step that
  closes all three.
- The settlement is a real on-chain transfer over the USDC asset (testnet),
  but of a fixed, symbolic marker amount, not the salary. Moving the real figure
  in clear would leak it on a transparent chain, so the salary stays in the
  commitment. When a worker or treasury has no USDC trustline yet, the
  settlement falls back to a native XLM marker so it always posts.
- The deployed Groth16 setup uses a multi-party ceremony: three independent
  contributions per phase plus a public random beacon, scripted in
  `circuits/scripts/ceremony.sh`. The verifier was redeployed and initialized
  with that verification key and validated on testnet (proof_id 0, verified
  true). For a production launch the ceremony would run with external
  contributors rather than on a single host.
- `pnpm e2e` boots the production build and checks routing, RBAC redirects,
  security headers, public-page rendering, and an authenticated flow (demo
  login signs a session and the company portal renders for it). Contracts have
  unit tests (`cargo test`) and the proving + disclosure path has unit tests
  (`pnpm test`). The full payment flow (invite, anchor, payroll, disclosure)
  needs Privy, a database and testnet keys, so it is exercised on a configured
  environment.
- The UI and Help Center are in English. No PT-BR localization yet.

Security policy and how to report a vulnerability: [`SECURITY.md`](SECURITY.md).
The internal audit log with open findings is kept private until remediated.

### Live on testnet

- App: https://web-production-f389ce.up.railway.app
- [AnchorRegistry contract](https://stellar.expert/explorer/testnet/contract/CA4QF73R2H2LNJ7CZUPMIXGIZS5MVTW4R3NY36CUYQJ3NJMQHQKODXI5)
- [Verifier contract (one instance: per-payment + aggregate Proof-of-Payroll)](https://stellar.expert/explorer/testnet/contract/CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q)

### Verify it yourself

You do not have to trust us. Read a recorded proof straight from the live
verifier on testnet (the proof is checked on-chain with the native BN254 pairing
before it is stored):

```bash
stellar contract invoke \
  --id CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q \
  --source-account <any-funded-testnet-key> \
  --network testnet \
  -- get_proof_record --proof_id 0
```

It returns the record with `verified: true`, the recipient address hash, the
settlement tx hash, and the amount commitment, none of which reveal the salary.

Read an aggregate Proof-of-Payroll record from the same verifier. It returns the
proven `total`, `verified: true`, and the treasury-coverage flag `covered`, with no
individual salary:

```bash
stellar contract invoke \
  --id CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q \
  --source-account <any-funded-testnet-key> \
  --network testnet \
  -- get_payroll_record --proof_id 3
```

Prefer a browser? The landing page has a public, wallet-free verify panel
([`/#verify`](https://web-production-f389ce.up.railway.app/#verify)) that reads a
recorded proof straight from the on-chain verifier.

Prefer one command? `pnpm demo` records a real proof on testnet, then watches a
forged proof and a replayed proof get rejected on-chain.

CI proves and verifies both circuits (per-payment and aggregate) on every push
via `pnpm zk:ci`, next to the contract `cargo test` and the web build.

## Legal note

ShieldPay fits Web3-native teams, DAOs paying contributors, contractors and
service providers, and cross-border payments, where payment in USDC is valid by
contractual agreement. It does not claim to replace Brazilian CLT payroll. The
compliance and identity-anchor rationale is in [`docs/LEGAL.md`](docs/LEGAL.md).

## License

[MIT](LICENSE)

<div align="center">
<sub>Built on Stellar and Zero-Knowledge · Stellar Hacks: ZK 2026</sub>
</div>
