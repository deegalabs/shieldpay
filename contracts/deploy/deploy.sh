#!/usr/bin/env bash
# Deploy AnchorRegistry and PaymentVerifier to Stellar testnet.
# Prereqs: stellar-cli 26+, a funded identity (see below), built wasm.
set -euo pipefail

cd "$(dirname "$0")/.."

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE="${STELLAR_SOURCE:-shieldpay}"
OUT="deploy/addresses.json"

# Configure testnet + a funded key on first run:
#   stellar network add testnet \
#     --rpc-url https://soroban-testnet.stellar.org \
#     --network-passphrase "Test SDF Network ; September 2015"
#   stellar keys generate "$SOURCE" --network testnet --fund

echo "==> Building before deploy"
bash deploy/build.sh

REL="target/wasm32v1-none/release"

echo "==> Deploying AnchorRegistry"
ANCHOR_ID=$(stellar contract deploy \
  --wasm "$REL/anchor_registry.wasm" \
  --source "$SOURCE" --network "$NETWORK")
echo "    AnchorRegistry: $ANCHOR_ID"

echo "==> Deploying PaymentVerifier"
VERIFIER_ID=$(stellar contract deploy \
  --wasm "$REL/payment_verifier.wasm" \
  --source "$SOURCE" --network "$NETWORK")
echo "    PaymentVerifier: $VERIFIER_ID"

echo "==> Initializing PaymentVerifier with the circuit verification key"
VK_HEX=$(node -e "const fs=require('fs');const vk=fs.readFileSync('../circuits/payment_proof/target/verification_key.json');process.stdout.write(vk.toString('hex'))" 2>/dev/null || echo "")
if [ -n "$VK_HEX" ]; then
  stellar contract invoke --id "$VERIFIER_ID" --source "$SOURCE" --network "$NETWORK" \
    -- initialize --vk_bytes "$VK_HEX"
else
  echo "    WARNING: verification_key.json not found. Run 'npm run zk:setup' first,"
  echo "    then call initialize manually."
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
