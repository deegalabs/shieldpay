#!/usr/bin/env bash
# Compile the Proof-of-Payroll circuit and run a Groth16 trusted setup.
#
# Output artifacts (in circuits/payroll_proof/target):
#   payroll_proof.r1cs
#   payroll_proof_js/payroll_proof.wasm       <- witness generator (runtime)
#   payroll_proof_final.zkey                   <- proving key (runtime)
#   payroll_verification_key.json              <- committed; loaded into the verifier
#
# Requires: circom (github.com/iden3/circom) and snarkjs (already in node_modules).
# The powers-of-tau here is a fresh local ceremony for the hackathon; use a proper
# multi-party ptau for production (see ceremony.sh for the multi-party variant).
set -euo pipefail

cd "$(dirname "$0")/.."
CIRCUIT="payroll_proof"
SRC="$CIRCUIT/$CIRCUIT.circom"
OUT="$CIRCUIT/target"
# The aggregate circuit (N=8 Poseidon + range checks) is larger than the single
# payment proof; 2^15 = 32768 constraints gives ample headroom.
PTAU_POWER=15

command -v circom >/dev/null || { echo "circom not found. Install: cargo install --git https://github.com/iden3/circom.git circom"; exit 1; }
SNARKJS="../node_modules/.bin/snarkjs"
[ -x "$SNARKJS" ] || SNARKJS="snarkjs"

mkdir -p "$OUT"

echo "==> [1/5] Compiling circuit"
circom "$SRC" --r1cs --wasm --sym -l ../node_modules -o "$OUT"

echo "==> [2/5] Powers of Tau (phase 1)"
"$SNARKJS" powersoftau new bn128 "$PTAU_POWER" "$OUT/pot_0.ptau" -v
"$SNARKJS" powersoftau contribute "$OUT/pot_0.ptau" "$OUT/pot_1.ptau" \
  --name="shieldpay-payroll-demo" -v -e="$(head -c 32 /dev/urandom | base64)"
"$SNARKJS" powersoftau prepare phase2 "$OUT/pot_1.ptau" "$OUT/pot_final.ptau" -v

echo "==> [3/5] Groth16 setup (phase 2)"
"$SNARKJS" groth16 setup "$OUT/$CIRCUIT.r1cs" "$OUT/pot_final.ptau" "$OUT/${CIRCUIT}_0.zkey"
"$SNARKJS" zkey contribute "$OUT/${CIRCUIT}_0.zkey" "$OUT/${CIRCUIT}_final.zkey" \
  --name="shieldpay-payroll-key" -v -e="$(head -c 32 /dev/urandom | base64)"

echo "==> [4/5] Exporting verification key"
"$SNARKJS" zkey export verificationkey "$OUT/${CIRCUIT}_final.zkey" "$OUT/payroll_verification_key.json"

echo "==> [5/5] Cleaning intermediate ptau"
rm -f "$OUT/pot_0.ptau" "$OUT/pot_1.ptau" "$OUT/${CIRCUIT}_0.zkey"

echo "==> Done. Runtime artifacts ready in $OUT"
ls -lh "$OUT"
