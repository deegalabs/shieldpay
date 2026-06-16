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

## ZK verification status

`payment_verifier` records verified proofs and exposes `verify_groth16` as the
integration seam for the on-chain pairing check. The cryptographic check is
implemented with Stellar's native **BLS12-381 host functions**, following the
official [`stellar/soroban-examples/groth16_verifier`](https://github.com/stellar/soroban-examples/tree/main/groth16_verifier).
See [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the milestone plan and
an honest status of what is wired vs. stubbed.
