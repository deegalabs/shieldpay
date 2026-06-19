# ShieldPay: Legal and Compliance Note

> This document is product rationale, not legal advice. ShieldPay is positioned
> as confidential payroll for Web3 teams and DAOs. The points below explain how
> the same evidence chain also supports compliance and dispute defense, which is
> a useful property rather than the primary pitch.

## Why an identity anchor matters

A blockchain payment from `GABC...` to `GXYZ...` does not, on its own, link an
on-chain address to a legal identity. ShieldPay closes that gap with an identity
anchor: the contributor signs an on-chain transaction from their own wallet that
binds the address to their contract metadata, including a hash of their tax id.
This creates a cryptographic, timestamped link between the address and the
declared identity, without publishing the tax id itself.

## How the evidence chain maps to a dispute

| # | Artifact | On or off chain | Effect |
| --- | --- | --- | --- |
| 1 | Signed service agreement | Off-chain | Establishes the agreement and declares the contributor's Stellar address. |
| 2 | Identity anchor tx | On-chain (Stellar) | Timestamped proof that the address owner declared their identity. Creates the address to identity link. |
| 3 | Settlement record | On-chain (Stellar) | Recipient-visible, memo-bound record of the payment to the worker address. |
| 4 | ZK proof | On-chain (Soroban) | Anyone can verify the amount was within the agreed range. |
| 5 | Verifiable receipt and disclosure | Off-chain | Plain-language bundle of the hashes and the proof, with selective disclosure of the exact amount to an authorized auditor. |

## Brazilian context

For reference, Brazilian labor courts under Art. 464 CLT accept two forms of
valid proof of salary payment: a payslip signed by the employee, or a bank
deposit receipt into an account whose tax id belongs to the worker. The identity
anchor plus the settlement record are designed to play a similar role for on-chain
payments, by binding the address to the declared identity.

## Scope

- **Works today with no new law:** contractors and service providers,
  Web3-native companies, cross-border payments, and DAOs paying contributors,
  where payment in USDC is valid by contractual agreement.
- **Not in scope:** full CLT salary in crypto, which depends on bills in progress
  (PL 957/2025 and PL 2.324/2026). ShieldPay does not claim to replace CLT
  payroll. This limitation is stated openly.

## Privacy, stated honestly

Stellar is transparent by default. The ZK layer provides range privacy, not
invisibility. Anyone watching the chain can see that the company paid the worker.
They cannot see the exact amount, which is the commercially sensitive figure. We
do not promise Zcash-style shielded pools. The exact amount is disclosed only to
an authorized auditor through the viewing key, and is re-verified against the
on-chain commitment.
