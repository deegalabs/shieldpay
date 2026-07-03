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
`CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q`, with a verified
aggregate proof at tx
`33c783629d345c864175d511873f195595c90e3f276a3aba81b0fe99d7aa336b`. All 25 public
signals verify within the Soroban compute budget.

**On-chain binding and honest limits.** The payroll verifier now binds each
non-padding line to a recorded per-payment proof of the same company with a
matching range (a commitment -> record index plus the range stored in each record),
so a company cannot aggregate with invented lines or ranges. It also records a
point-in-time treasury-coverage flag. Where we do not overclaim: the worker-cosigned
range enforcement protects the honest payment flow but is bypassable by a company
crafting raw calls (a mismatched identity hash), coverage is a snapshot not an
escrowed reserve, and the proof does not validate the USDC transfer itself. Binding
the real recipient and settlement to the anchored identity on-chain is roadmap.

### Deployed instances (testnet)

| Instance | Contract id |
| --- | --- |
| PaymentVerifier (per payment) | `CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q` |
| Payroll verifier (Proof-of-Payroll) | `CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q` |
| AnchorRegistry | `CA4QF73R2H2LNJ7CZUPMIXGIZS5MVTW4R3NY36CUYQJ3NJMQHQKODXI5` |
