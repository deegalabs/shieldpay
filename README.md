<div align="center">

# 🛡️ ShieldPay

### Payroll & Payment Proof on Stellar + Zero-Knowledge

**Pay anyone in the world. Prove mathematically that you paid. Protect your company forever.**

[![Stellar](https://img.shields.io/badge/Stellar-Protocol%2026-7D00FF?logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-soroban--sdk%2026-08B5A5)](https://developers.stellar.org/docs/build/smart-contracts/overview)
[![ZK](https://img.shields.io/badge/ZK-Groth16%20zk--SNARK-6366F1)](https://docs.circom.io/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981.svg)](LICENSE)

Submission for **Stellar Hacks: ZK** · Real-world ZK on Stellar

</div>

---

## The problem

> Your company paid a contractor in crypto. Months later they claim they never
> received it. **How do you prove it in court?**

A blockchain transfer from `GABC…` to `GXYZ…` proves nothing to a judge — there
is no link between an on-chain address and a legal identity, and the exact
salary (commercially sensitive) is exposed for the whole world to see.

## The solution

ShieldPay pays contractors in **native USDC on Stellar** and automatically
produces a **court-grade, on-chain proof of payment**. Every payout is backed by
a **zero-knowledge proof, verified inside a Soroban smart contract**, that the
amount fell within the agreed contractual range — *without revealing the exact
amount*.

The result: selective privacy (range, not the figure) **plus** an irrefutable,
independently verifiable record any judge, auditor, or accountant can validate.

## Why ZK is essential here

ZK isn't decoration on a slide — it's load-bearing. The product's core promise
is **"prove the payment was correct without disclosing the salary."** That is
exactly a zero-knowledge statement:

```
public:   valueCommitment, minValue, maxValue
private:  value, randomness

prove:    min ≤ value ≤ max  ∧  Poseidon(value, randomness) == valueCommitment
```

- **Proof system:** Groth16 (zk-SNARK) — one of the three officially endorsed
  Stellar ZK paths, and the one that fits the Soroban verification budget on
  testnet today.
- **Verified on-chain** in the `PaymentVerifier` Soroban contract via Stellar's
  native BLS12-381 host functions (Protocol 23+).

> We deliberately chose Groth16 over Noir/UltraHonk: UltraHonk verification is
> currently ~5–6× over the testnet compute budget and localnet-only. A readable
> Noir reference of the same circuit lives in
> [`circuits/noir_reference`](circuits/noir_reference). See
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full rationale.

## The five-layer proof chain

| Layer | What | Where |
| --- | --- | --- |
| 5 | Court-grade PDF receipt | Off-chain (generated) |
| 4 | **ZK proof of in-range payment** | **Soroban — `PaymentVerifier`** |
| 3 | USDC payment + structured memo | Stellar classic |
| 2 | Identity anchor (address ↔ CPF) | **Soroban — `AnchorRegistry`** |
| 1 | Digitally signed service contract | Off-chain |

Full diagram and flow in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tech stack

| Layer | Technology |
| --- | --- |
| Web (3 portals + API) | Next.js 14 (App Router), TypeScript, Tailwind |
| Smart contracts | Rust, `soroban-sdk` 26, target `wasm32v1-none` |
| ZK circuit (primary) | Circom 2 + Groth16 (snarkjs) |
| ZK circuit (reference) | Noir |
| Proof generation | snarkjs (pure JS — runs anywhere, incl. Railway) |
| Stellar integration | `@stellar/stellar-sdk` 15 (`rpc` namespace) |
| Database | PostgreSQL (Railway) |
| Deploy | Railway (app) · Stellar testnet (contracts) |

## Quickstart

```bash
# 0. prerequisites: Node >=20, Rust + stellar-cli, circom + snarkjs
bash scripts/setup.sh           # installs JS deps, prints a toolchain checklist

# 1. configure
cp .env.example .env.local      # fill in values

# 2. build the ZK circuit + trusted setup
npm run zk:setup

# 3. deploy contracts to testnet (writes contracts/deploy/addresses.json)
npm run contracts:deploy

# 4. seed demo identities (optional: --fund via friendbot)
npm run seed -- --fund

# 5. run the app
npm run dev                     # http://localhost:3000
```

End-to-end ZK smoke test (after `zk:setup`):

```bash
npm run test:flow               # valid in-range proof passes; out-of-range fails
```

## Project structure

```
shieldpay/
├── app/              Next.js — landing + 3 portals (company / worker / auditor) + API
├── lib/              Stellar client, ZK prover, PDF receipts, DB schema
├── contracts/        Soroban (Rust): anchor_registry, payment_verifier
├── circuits/         ZK: Circom (primary, Groth16) + Noir (reference)
├── scripts/          setup / seed / e2e flow
└── docs/             ARCHITECTURE · LEGAL · DEMO_SCRIPT
```

## The three portals

- **Company (CFO/HR)** — wallet login, CSV payroll upload with live validation,
  one-click "Legal Defense" PDF.
- **Worker** — wallet login, payment history, downloadable receipts for taxes.
- **Auditor** — read-only, time-boxed link (no wallet), period table + export.

> Design rule: cryptography is invisible. No ZK/Soroban jargon in the end-user
> UI — those terms appear only in the legal documents where they carry weight.

## Status — honest work-in-progress

This is a hackathon build; we'd rather show honest WIP than a polished mystery.

- ✅ Monorepo, three-portal app skeleton, design system
- ✅ Stellar SDK 15 integration (payments, memos, trustlines, wallet auth)
- ✅ Circom range-proof circuit + Groth16 trusted-setup pipeline + snarkjs prover
- ✅ Soroban contracts (`AnchorRegistry`, `PaymentVerifier`) deployed to testnet
- ✅ **Real on-chain Groth16/BN254 pairing verification** in `PaymentVerifier`
  via `soroban_sdk::crypto::bn254` — verified on testnet (valid proof records;
  wrong public signals rejected with `InvalidProof`)
- 🚧 DB persistence + receipt PDF wiring into the live flow
- 🚧 Frontend portals wired to the live contracts (currently mock data)
- ⏳ Mock data is used where noted (dashboards, seed identities)

### Live on testnet

- App: https://web-production-f389ce.up.railway.app
- [AnchorRegistry contract](https://stellar.expert/explorer/testnet/contract/CD5EFRVN5KUQ4FCNX6FNIICM7JNYG4ZIKRKIU5DPUVFYJOIMDGCCWYZI)
- [PaymentVerifier contract](https://stellar.expert/explorer/testnet/contract/CB6LJ2YRBUVHKDQ4CPKDXH3BSUSQM6UR4WKRCLVJZG6VES7KDMTCDDKF)

## Legal context

ShieldPay targets contractors/PJ, Web3-native companies, cross-border payments,
and DAOs — where crypto payment is valid by contractual agreement **today**. It
does **not** claim to replace Brazilian CLT payroll. Details and the Art. 464
CLT mapping in [`docs/LEGAL.md`](docs/LEGAL.md).

## License

[MIT](LICENSE)

<div align="center">
<sub>Built on Stellar + Zero-Knowledge · Stellar Hacks: ZK 2026</sub>
</div>
