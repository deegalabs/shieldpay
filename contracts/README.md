# ShieldPay Soroban Contracts

Two Rust/Soroban contracts form the on-chain trust layer.

| Contract | Layer | Responsibility |
| --- | --- | --- |
| `anchor_registry` | 2 — Identity anchor | Binds a worker's Stellar address to their contract metadata (self-anchored). |
| `payment_verifier` | 4 — ZK proof | Verifies a Groth16 proof of in-range payment and records it immutably. |

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
