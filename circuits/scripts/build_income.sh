#!/usr/bin/env bash
# Compile the Income Credential circuit and run a Groth16 trusted setup.
#
# Output artifacts (in circuits/income_credential/target):
#   income_credential.r1cs
#   income_credential_js/income_credential.wasm     <- witness generator (runtime)
#   income_credential_final.zkey                     <- proving key (runtime)
#   income_verification_key.json                     <- committed; loaded into the verifier
#
# Requires: circom (github.com/iden3/circom) and snarkjs (already in node_modules).
# The powers-of-tau here is a fresh local ceremony for the hackathon; use a proper
# multi-party ptau for production (see ceremony.sh for the multi-party variant).
set -euo pipefail

cd "$(dirname "$0")/.."
CIRCUIT="income_credential"
SRC="$CIRCUIT/$CIRCUIT.circom"
OUT="$CIRCUIT/target"
# This circuit verifies N=6 EdDSA-Poseidon signatures in-circuit, so it is far
# larger than the payroll aggregate: ~52.8k constraints. 2^16 = 65536 covers it.
PTAU_POWER=16

command -v circom >/dev/null || { echo "circom not found. Install: cargo install --git https://github.com/iden3/circom.git circom"; exit 1; }
SNARKJS="../node_modules/.bin/snarkjs"
[ -x "$SNARKJS" ] || SNARKJS="snarkjs"

mkdir -p "$OUT"

echo "==> [1/5] Compiling circuit"
circom "$SRC" --r1cs --wasm --sym -l ../node_modules -o "$OUT"

echo "==> [2/5] Powers of Tau (phase 1)"
"$SNARKJS" powersoftau new bn128 "$PTAU_POWER" "$OUT/pot_0.ptau" -v
"$SNARKJS" powersoftau contribute "$OUT/pot_0.ptau" "$OUT/pot_1.ptau" \
  --name="shieldpay-income-demo" -v -e="$(head -c 32 /dev/urandom | base64)"
"$SNARKJS" powersoftau prepare phase2 "$OUT/pot_1.ptau" "$OUT/pot_final.ptau" -v

echo "==> [3/5] Groth16 setup (phase 2)"
"$SNARKJS" groth16 setup "$OUT/$CIRCUIT.r1cs" "$OUT/pot_final.ptau" "$OUT/${CIRCUIT}_0.zkey"
"$SNARKJS" zkey contribute "$OUT/${CIRCUIT}_0.zkey" "$OUT/${CIRCUIT}_final.zkey" \
  --name="shieldpay-income-key" -v -e="$(head -c 32 /dev/urandom | base64)"

echo "==> [4/5] Exporting verification key"
"$SNARKJS" zkey export verificationkey "$OUT/${CIRCUIT}_final.zkey" "$OUT/income_verification_key.json"

echo "==> [5/5] Cleaning intermediate ptau"
rm -f "$OUT/pot_0.ptau" "$OUT/pot_1.ptau" "$OUT/${CIRCUIT}_0.zkey"

echo "==> Done. Runtime artifacts ready in $OUT"
ls -lh "$OUT"
