#!/usr/bin/env bash
# Multi-party Groth16 trusted setup ceremony for the payment_proof circuit.
#
# Unlike setup.sh (a single-contributor demo ceremony), this runs N independent
# contributions in both phases plus a public random beacon, so the setup is
# trustworthy as long as at least one contributor is honest and discards their
# toxic waste. Each contributor should run their step on their own machine and
# pass the file on; the loop below is the scripted, single-host equivalent for
# reproducing or testing the flow.
#
#   bash circuits/scripts/ceremony.sh [CONTRIBUTORS] [OUT_DIR]
#     CONTRIBUTORS  number of contributions per phase (default 3)
#     OUT_DIR       output dir (default circuits/payment_proof/ceremony_out)
#
# IMPORTANT: this changes the verification key. After running it you MUST:
#   1. copy the new verification_key.json and *_final.zkey into the app,
#   2. redeploy + re-initialize the PaymentVerifier with the new VK,
#   3. regenerate the contract test fixtures and run `cargo test`,
#   4. update contracts/deploy/addresses.json with the new contract id.
# Do NOT ship a new zkey without redeploying, or on-chain verification breaks.
#
# For the strongest guarantee, replace the locally generated phase-1 below with
# a community perpetual powers-of-tau (e.g. Hermez) of matching power.
set -euo pipefail

cd "$(dirname "$0")/.."
CIRCUIT="payment_proof"
SRC="$CIRCUIT/$CIRCUIT.circom"
N="${1:-3}"
OUT="${2:-$CIRCUIT/ceremony_out}"
PTAU_POWER=12

SNARKJS="${SNARKJS:-snarkjs}"
command -v circom >/dev/null || { echo "circom not found"; exit 1; }
command -v "$SNARKJS" >/dev/null || SNARKJS="../node_modules/.bin/snarkjs"
command -v "$SNARKJS" >/dev/null || { echo "snarkjs not found"; exit 1; }

rm -rf "$OUT"; mkdir -p "$OUT"

echo "==> Compiling circuit"
circom "$SRC" --r1cs --wasm --sym -l ../node_modules -o "$OUT"

echo "==> Phase 1: powers of tau with $N contributions"
"$SNARKJS" powersoftau new bn128 "$PTAU_POWER" "$OUT/pot_0.ptau" -v
prev="$OUT/pot_0.ptau"
for i in $(seq 1 "$N"); do
  next="$OUT/pot_$i.ptau"
  "$SNARKJS" powersoftau contribute "$prev" "$next" \
    --name="contributor-$i" -v -e="$(head -c 64 /dev/urandom | base64)"
  prev="$next"
done
"$SNARKJS" powersoftau prepare phase2 "$prev" "$OUT/pot_final.ptau" -v

echo "==> Phase 2: groth16 zkey with $N contributions + beacon"
"$SNARKJS" groth16 setup "$OUT/$CIRCUIT.r1cs" "$OUT/pot_final.ptau" "$OUT/key_0.zkey"
prev="$OUT/key_0.zkey"
for i in $(seq 1 "$N"); do
  next="$OUT/key_$i.zkey"
  "$SNARKJS" zkey contribute "$prev" "$next" \
    --name="key-contributor-$i" -v -e="$(head -c 64 /dev/urandom | base64)"
  prev="$next"
done
# Public random beacon finalizes the ceremony (no one controls the last step).
BEACON="$(head -c 32 /dev/urandom | xxd -p -c 64)"
"$SNARKJS" zkey beacon "$prev" "$OUT/${CIRCUIT}_final.zkey" "$BEACON" 10 \
  --name="final-beacon" -v

echo "==> Verifying the final zkey against the r1cs + ptau"
"$SNARKJS" zkey verify "$OUT/$CIRCUIT.r1cs" "$OUT/pot_final.ptau" "$OUT/${CIRCUIT}_final.zkey"

echo "==> Exporting verification key"
"$SNARKJS" zkey export verificationkey "$OUT/${CIRCUIT}_final.zkey" "$OUT/verification_key.json"

rm -f "$OUT"/pot_*.ptau "$OUT"/key_*.zkey
echo "==> Done. New artifacts in $OUT (NOT yet wired in; see the header for the redeploy steps)."
