<div align="center">

# 🛡️ ShieldPay

### Confidential payroll for DAOs and Web3 teams on Stellar

**Settle contributor payments on Stellar and prove on-chain that each one was correct, while keeping the amount private and disclosing the exact figure only to an authorized auditor.**

[![Stellar](https://img.shields.io/badge/Stellar-Protocol%2026-7D00FF?logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-soroban--sdk%2026-08B5A5)](https://developers.stellar.org/docs/build/smart-contracts/overview)
[![ZK](https://img.shields.io/badge/ZK-Groth16%20zk--SNARK-6366F1)](https://docs.circom.io/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981.svg)](LICENSE)

Submission for **Stellar Hacks: ZK** · Real-world ZK on Stellar

ShieldPay builds the hackathon's "confidential payroll" idea: pay a team in
stablecoins with each amount private on-chain, while the company can still prove
totals to an auditor. The ZK is load-bearing: a Groth16 proof is verified inside
a Soroban smart contract with Stellar's native BN254 pairing, not namechecked.

</div>

---

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

## The proof and settlement chain

| Layer | What | Where |
| --- | --- | --- |
| Receipt and disclosure | Verifiable receipt PDF, plus the viewing-key disclosure | Off-chain |
| ZK proof | Groth16 proof of in-range payment, bound to the settlement | Soroban, `PaymentVerifier` |
| Settlement | Recipient-visible, memo-bound on-chain record (symbolic amount) | Stellar classic |
| Identity anchor | Worker self-anchors their address and contract metadata | Soroban, `AnchorRegistry` |
| Organization and invite | Company setup and seedless onboarding | Off-chain |

The exact amount stays a commitment at every public layer. Full diagram and flow
in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

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
├── circuits/         ZK: Circom (primary, Groth16) and Noir (reference)
├── scripts/          setup / seed / e2e flow
└── docs/             ARCHITECTURE · LEGAL · DEMO_SCRIPT
```

## Authentication

Seedless login through Privy (email, Google, or passkey), which creates a Stellar
account for the user, so payroll and accounting users never touch a seed phrase.
A one-click demo login is available for evaluation. Auditors get a signed,
expiring read-only link, with no wallet needed. Sessions are signed JWTs, and
routes are role-gated by middleware.

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
- Selective disclosure with AES-256-GCM sealing, re-verified against the
  on-chain commitment.
- Real, recipient-visible, memo-bound settlement record, with the proof bound to
  the settlement transaction hash.
- Postgres persistence on Railway, scoped per company, with the exact amount
  never stored in clear.

Honest limitations:

- The settlement is a real on-chain transfer over the USDC asset (testnet),
  but of a fixed, symbolic marker amount, not the salary. Moving the real figure
  in clear would leak it on a transparent chain, so the salary stays in the
  commitment. When a worker or treasury has no USDC trustline yet, the
  settlement falls back to a native XLM marker so it always posts.
- The deployed Groth16 setup used a single-contributor ceremony. A multi-party
  ceremony (N independent contributions per phase plus a public random beacon)
  is scripted in `circuits/scripts/ceremony.sh` and validated; adopting it in
  production is a redeploy of the verifier with the new verification key.
- `pnpm e2e` boots the production build and checks routing, RBAC redirects,
  security headers and public-page rendering; contracts have unit tests
  (`cargo test`) and the proving + disclosure path has unit tests (`pnpm test`).
  The full payment flow (invite, anchor, payroll, disclosure) needs Privy, a
  database and testnet keys, so it is exercised on a configured environment.
- The UI and Help Center are in English. No PT-BR localization yet.

Security policy and how to report a vulnerability: [`SECURITY.md`](SECURITY.md).
The internal audit log with open findings is kept private until remediated.

### Live on testnet

- App: https://web-production-f389ce.up.railway.app
- [AnchorRegistry contract](https://stellar.expert/explorer/testnet/contract/CD5EFRVN5KUQ4FCNX6FNIICM7JNYG4ZIKRKIU5DPUVFYJOIMDGCCWYZI)
- [PaymentVerifier contract](https://stellar.expert/explorer/testnet/contract/CCLEDEZ2YA73SOL3AIMU7ZWV7LJMDMZYXAKCBW5GQLNYYABNA64XQE5Z)

### Verify it yourself

You do not have to trust us. Read a recorded proof straight from the live
verifier on testnet (the proof is checked on-chain with the native BN254 pairing
before it is stored):

```bash
stellar contract invoke \
  --id CCLEDEZ2YA73SOL3AIMU7ZWV7LJMDMZYXAKCBW5GQLNYYABNA64XQE5Z \
  --source-account <any-funded-testnet-key> \
  --network testnet \
  -- get_proof_record --proof_id 2
```

It returns the record with `verified: true`, the recipient address hash, the
settlement tx hash, and the amount commitment, none of which reveal the salary.

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
