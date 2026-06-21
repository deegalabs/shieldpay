#!/usr/bin/env bash
# Compile the Circom circuit and run a Groth16 trusted setup.
#
# Output artifacts (in circuits/payment_proof/target):
#   payment_proof.r1cs
#   payment_proof_js/payment_proof.wasm     <- witness generator (runtime)
#   payment_proof_final.zkey                 <- proving key (runtime)
#   verification_key.json                    <- committed; loaded into the verifier
#
# NOTE: the powers-of-tau here is a fresh local "ceremony" for the hackathon
# demo. For production, use a proper multi-party ptau (e.g. Hermez).
set -euo pipefail

cd "$(dirname "$0")/.."
CIRCUIT="payment_proof"
SRC="$CIRCUIT/$CIRCUIT.circom"
OUT="$CIRCUIT/target"
PTAU_POWER=12   # 2^12 = 4096 constraints, ample for this circuit

command -v circom >/dev/null || { echo "circom not found. Install: https://docs.circom.io/getting-started/installation/"; exit 1; }
command -v snarkjs >/dev/null || { echo "snarkjs not found. Run: npm i -g snarkjs (or use npx)"; exit 1; }

mkdir -p "$OUT"

echo "==> [1/5] Compiling circuit"
circom "$SRC" --r1cs --wasm --sym -l ../node_modules -o "$OUT"

echo "==> [2/5] Powers of Tau (phase 1)"
snarkjs powersoftau new bn128 "$PTAU_POWER" "$OUT/pot_0.ptau" -v
snarkjs powersoftau contribute "$OUT/pot_0.ptau" "$OUT/pot_1.ptau" \
  --name="shieldpay-demo" -v -e="$(head -c 32 /dev/urandom | base64)"
snarkjs powersoftau prepare phase2 "$OUT/pot_1.ptau" "$OUT/pot_final.ptau" -v

echo "==> [3/5] Groth16 setup (phase 2)"
snarkjs groth16 setup "$OUT/$CIRCUIT.r1cs" "$OUT/pot_final.ptau" "$OUT/${CIRCUIT}_0.zkey"
snarkjs zkey contribute "$OUT/${CIRCUIT}_0.zkey" "$OUT/${CIRCUIT}_final.zkey" \
  --name="shieldpay-key" -v -e="$(head -c 32 /dev/urandom | base64)"

echo "==> [4/5] Exporting verification key"
snarkjs zkey export verificationkey "$OUT/${CIRCUIT}_final.zkey" "$OUT/verification_key.json"

echo "==> [5/5] Cleaning intermediate ptau"
rm -f "$OUT/pot_0.ptau" "$OUT/pot_1.ptau" "$OUT/${CIRCUIT}_0.zkey"

echo "==> Done. Runtime artifacts ready in $OUT"
ls -lh "$OUT"
