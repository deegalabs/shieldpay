#!/usr/bin/env bash
# Build all Soroban contracts to the canonical wasm32v1-none target.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Ensuring wasm32v1-none target is installed"
rustup target add wasm32v1-none

echo "==> Building contracts (optimized)"
stellar contract build

echo "==> Build artifacts:"
ls -lh target/wasm32v1-none/release/*.wasm
