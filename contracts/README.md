# ShieldPay Soroban Contracts

Two Rust/Soroban contracts form the on-chain trust layer.

| Contract | Layer | Responsibility |
| --- | --- | --- |
| `anchor_registry` | 2 — Identity anchor | Binds a worker's Stellar address to their contract metadata (self-anchored). |
| `payment_verifier` | 4, ZK proof | Verifies a Groth16 proof of in-range payment and records it immutably. Also verifies the aggregate Proof-of-Payroll (deployed as a second instance). |

## Contract methods

`payment_verifier` exposes:

- Per payment: `initialize`, `verify_and_record`, `is_verified`,
  `get_proof_record`.
- Proof-of-Payroll (aggregate): `verify_and_record_payroll`,
  `is_payroll_verified`, `get_payroll_record`.

`anchor_registry` is unchanged: `anchor`, `is_anchored`, `get_anchor`.

## Toolchain

- `stellar-cli` 26+ (binary is `stellar`, **not** `soroban`)
- `soroban-sdk` 26
- Build target: **`wasm32v1-none`** (Protocol 23+ canonical target)

## Build

```bash
npm run contracts:build      # -> contracts/deploy/build.sh
# or directly:
cd contracts && stellar contract build
```

## Test

```bash
cd contracts && cargo test
```

## Deploy (testnet)

```bash
# one-time identity setup
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
stellar keys generate shieldpay --network testnet --fund

npm run contracts:deploy     # -> contracts/deploy/deploy.sh
```

Deployed contract IDs are written to `deploy/addresses.json` and printed for
your `.env` / Railway variables.

## ZK verification status — REAL, on-chain

`payment_verifier` runs the **full Groth16 pairing check on-chain** using
Stellar's native **BN254** host functions (`soroban_sdk::crypto::bn254`):

```
e(-A, B) · e(alpha, beta) · e(vk_x, gamma) · e(C, delta) == 1
vk_x = IC[0] + sum_i (public_i · IC[i+1])
```

We use BN254 (matching the Circom + snarkjs toolchain), not the BLS12-381 of the
official BLS example. snarkjs `verification_key.json` / `proof.json` /
`public.json` are converted to the on-chain byte layout (uncompressed big-endian,
G2 in c1-before-c0 order) by
[`circuits/scripts/encode_bn254_for_soroban.mjs`](../circuits/scripts/encode_bn254_for_soroban.mjs).

Verified on testnet:
- valid proof → recorded, `is_verified` returns `true`
- proof with wrong public signals → rejected with `InvalidProof` (Error #3)

Unit tests (`cargo test -p payment_verifier`) run the real pairing against
committed fixtures in `src/testdata/`.

## Proof-of-Payroll: aggregate verification

`verify_and_record_payroll` runs the same on-chain Groth16 / BN254 pairing check,
but against the aggregate Proof-of-Payroll circuit
(`circuits/payroll_proof`). It verifies one proof over a whole run (25 public
signals: `commitment[8]`, `minValue[8]`, `maxValue[8]`, `total`) and records a
`PayrollRecord`. The recorded total is bound to the proof's last public signal.
`is_payroll_verified` and `get_payroll_record` read the recorded runs.

This runs as a **separate instance** of the same `payment_verifier` contract,
initialized with the payroll verification key (distinct from the per-payment
instance). Live on Stellar testnet at
`CCI4WXRQN5PHZFUHZQKIMXKFZA4EU7JS45UT2AEPKEACBGOGAORPFUTN`, with a verified
aggregate proof at tx
`33c783629d345c864175d511873f195595c90e3f276a3aba81b0fe99d7aa336b`. All 25 public
signals verify within the Soroban compute budget.

**Honest limitation.** The payroll verifier binds only the total to the proof, not
the per-line ranges or the per-payment commitments to the recorded records. So
"everyone was paid within their agreed range" currently rests on the honest prover
supplying the real ranges. Binding per-line ranges and commitments on-chain is
documented future work.

### Deployed instances (testnet)

| Instance | Contract id |
| --- | --- |
| PaymentVerifier (per payment) | `CAUK3NRZTPYJZY6GJYIALALFC6WTT6RKHAU6SU5PHWBNPUMFKZZWNXV3` |
| Payroll verifier (Proof-of-Payroll) | `CCI4WXRQN5PHZFUHZQKIMXKFZA4EU7JS45UT2AEPKEACBGOGAORPFUTN` |
| AnchorRegistry | `CD5EFRVN5KUQ4FCNX6FNIICM7JNYG4ZIKRKIU5DPUVFYJOIMDGCCWYZI` |
