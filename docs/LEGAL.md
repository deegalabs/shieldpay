# ShieldPay — Legal Context

> This document summarizes why ShieldPay is built the way it is. It is product
> rationale, **not legal advice**.

## The problem

Brazilian labor courts (TST), under Art. 464 CLT, accept exactly two forms of
valid proof of salary payment:

- **Path A** — a payslip **signed by the employee**.
- **Path B** — a **bank deposit receipt** into an account whose CPF (tax id)
  belongs to the worker, no extra signature required.

A payslip without the employee's signature, unaccompanied by an identified bank
deposit, has **zero evidentiary value**. The burden of proof is always on the
employer.

## The Web3 gap

A blockchain payment from `GABC…` to `GXYZ…` proves nothing to a judge: there is
no link between the on-chain address and a legal identity (CPF). ShieldPay
closes that gap.

## How ShieldPay maps to the law (the 5 documents)

| # | Document | On/Off chain | Legal effect |
| --- | --- | --- | --- |
| 1 | Signed service contract | Off-chain | Establishes the agreement; declares the worker's Stellar address (Art. 104 CC). |
| 2 | Identity anchor tx | On-chain (Stellar) | Cryptographic, timestamped proof that the address owner declared the CPF. Creates the address↔identity link. |
| 3 | Payment tx (USDC + memo) | On-chain (Stellar) | Equivalent to the bank-deposit receipt (Path B), once bound to #2. |
| 4 | ZK proof of settlement | On-chain (Soroban) | Verifiable by any third party that the amount was within the agreed range. |
| 5 | Court-grade PDF | Off-chain | Plain-language bundle of all hashes + proof + QR for a non-technical judge. |

## Scope — what works today vs. what needs new law

- **Works today (no new law):** PJ / freelancers / service providers, Web3-native
  companies, cross-border payments, DAOs paying contributors. Payment in USDC is
  valid by contractual agreement.
- **Not yet:** full CLT salary in crypto. That depends on bills in progress
  (PL 957/2025; PL 2.324/2026). ShieldPay does **not** claim to replace CLT
  payroll. This limitation is stated openly.

## Privacy — honest framing

Stellar is transparent by default. The ZK layer provides **range privacy**, not
invisibility: anyone watching the chain can see that the company paid the worker;
they cannot see the **exact amount** (the commercially sensitive figure). We do
not promise Zcash-style shielded pools.
