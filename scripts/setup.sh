#!/usr/bin/env bash
# One-shot environment setup for ShieldPay development.
# Installs JS deps and prints next steps for the Rust/ZK toolchains.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing Node dependencies"
npm install

echo ""
echo "==> Toolchain checklist (install any that are missing):"
check() { command -v "$1" >/dev/null && echo "   [ok] $1 ($($1 --version 2>&1 | head -1))" || echo "   [--] $1  — $2"; }
check node    "https://nodejs.org (>=20)"
check stellar "curl -fsSL https://github.com/stellar/stellar-cli/install.sh | sh"
check cargo   "https://rustup.rs"
check circom  "https://docs.circom.io/getting-started/installation/"
check snarkjs "npm i -g snarkjs"
check nargo   "curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash (optional, reference circuit)"

echo ""
echo "==> Add the wasm target for Soroban:"
echo "      rustup target add wasm32v1-none"
echo ""
echo "==> Next steps:"
echo "   1. cp .env.example .env.local  (fill in values)"
echo "   2. npm run zk:setup            (build circuit + trusted setup)"
echo "   3. npm run contracts:deploy    (deploy to testnet, writes addresses.json)"
echo "   4. npm run seed                (seed demo company + workers)"
echo "   5. npm run dev                 (start the app)"
