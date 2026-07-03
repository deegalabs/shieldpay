#!/usr/bin/env bash
# Deploy AnchorRegistry and PaymentVerifier to Stellar testnet.
# Prereqs: stellar-cli 26+, a funded identity (see below), built wasm.
set -euo pipefail

cd "$(dirname "$0")/.."

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE="${STELLAR_SOURCE:-shieldpay}"
# DEPLOY_TARGET=all      deploy both contracts and write addresses.json (first deploy)
# DEPLOY_TARGET=verifier deploy ONLY a new PaymentVerifier, keep the existing
#                        AnchorRegistry, and DO NOT overwrite addresses.json
#                        (staged ceremony swap: validate the new id, then swap).
DEPLOY_TARGET="${DEPLOY_TARGET:-all}"
OUT="deploy/addresses.json"

# Configure testnet + a funded key on first run:
#   stellar network add testnet \
#     --rpc-url https://soroban-testnet.stellar.org \
#     --network-passphrase "Test SDF Network ; September 2015"
#   stellar keys generate "$SOURCE" --network testnet --fund
#   (or import an existing one: stellar keys add "$SOURCE" --secret-key)

echo "==> Building before deploy"
bash deploy/build.sh

REL="target/wasm32v1-none/release"

if [ "$DEPLOY_TARGET" = "verifier" ]; then
  ANCHOR_ID=$(node -e "console.log(require('./deploy/addresses.json').anchor_registry)")
  echo "==> Staged verifier-only deploy (keeping AnchorRegistry $ANCHOR_ID)"
else
  echo "==> Deploying AnchorRegistry"
  ANCHOR_ID=$(stellar contract deploy \
    --wasm "$REL/anchor_registry.wasm" \
    --source "$SOURCE" --network "$NETWORK")
  echo "    AnchorRegistry: $ANCHOR_ID"
fi

echo "==> Encoding the BN254 verification keys for the constructor"
# The PaymentVerifier is constructor-deployed: admin + BOTH keys are passed at
# deploy time (no post-deploy initialize/initialize_payroll). The instance is
# ready to verify immediately.
#   - admin: the deployer identity ($SOURCE). It is the only account allowed to
#     later call set_treasury_asset / set_anchor_registry.
#   - vk: the 5-signal per-payment key.
#   - vk_payroll: the 25-signal aggregate payroll key.
ADMIN=$(stellar keys address "$SOURCE")
VK_JSON="../circuits/payment_proof/target/verification_key.json"
VK_PAYROLL_JSON="../circuits/payroll_proof/target/payroll_verification_key.json"
if [ ! -f "$VK_JSON" ] || [ ! -f "$VK_PAYROLL_JSON" ]; then
  echo "    ERROR: verification key JSON not found."
  echo "      per-payment: $VK_JSON"
  echo "      payroll:     $VK_PAYROLL_JSON"
  echo "    Run the circuit setup (e.g. 'npm run zk:setup' and the payroll build)"
  echo "    first, then re-run this deploy."
  exit 1
fi
# Encode snarkjs VKs -> Soroban BN254 byte layout (NOT the raw JSON).
VK_HEX=$(node ../circuits/scripts/encode_bn254_for_soroban.mjs vk "$VK_JSON")
VK_PAYROLL_HEX=$(node ../circuits/scripts/encode_bn254_for_soroban.mjs vk "$VK_PAYROLL_JSON")

echo "==> Deploying PaymentVerifier (constructor: admin=$ADMIN + both VKs)"
VERIFIER_ID=$(stellar contract deploy \
  --wasm "$REL/payment_verifier.wasm" \
  --source "$SOURCE" --network "$NETWORK" \
  -- \
  --admin "$ADMIN" \
  --vk "$VK_HEX" \
  --vk_payroll "$VK_PAYROLL_HEX")
echo "    PaymentVerifier: $VERIFIER_ID"

if [ "$DEPLOY_TARGET" = "verifier" ]; then
  echo "==> Staged deploy done. The new verifier is NOT wired yet."
  echo "    1) Validate it:"
  echo "       COMPANY_SECRET_KEY=S... PAYMENT_VERIFIER_CONTRACT_ID=$VERIFIER_ID pnpm test:flow"
  echo "    2) If green, set PAYMENT_VERIFIER_CONTRACT_ID=$VERIFIER_ID in Railway,"
  echo "       update deploy/addresses.json + the README link, then merge + push."
  exit 0
fi

echo "==> Writing $OUT"
cat > "$OUT" <<EOF
{
  "network": "$NETWORK",
  "anchor_registry": "$ANCHOR_ID",
  "payment_verifier": "$VERIFIER_ID"
}
EOF

echo "==> Done. Add these to your .env / Railway variables:"
echo "    ANCHOR_REGISTRY_CONTRACT_ID=$ANCHOR_ID"
echo "    PAYMENT_VERIFIER_CONTRACT_ID=$VERIFIER_ID"
