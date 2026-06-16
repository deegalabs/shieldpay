pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

/*
 * ShieldPay — Payment range proof (Groth16 / BN254).
 *
 * Proves, in zero knowledge, that a payment `value` lies within the
 * contractual range [minValue, maxValue] and matches a public commitment,
 * WITHOUT revealing the exact `value`.
 *
 *   Private (witness): value, valueRandomness
 *   Public:            valueCommitment, minValue, maxValue
 *
 * Amounts are expressed in USDC cents (e.g. $500.00 -> 50000), so nBits=32
 * comfortably covers any realistic payroll amount.
 */
template PaymentProof(nBits) {
    // --- private inputs (never revealed) ---
    signal input value;
    signal input valueRandomness;

    // --- public inputs ---
    signal input valueCommitment;
    signal input minValue;
    signal input maxValue;

    // (1) Commitment binding: Poseidon(value, randomness) == valueCommitment.
    component commit = Poseidon(2);
    commit.inputs[0] <== value;
    commit.inputs[1] <== valueRandomness;
    commit.out === valueCommitment;

    // (2) Lower bound: value >= minValue.
    component geMin = GreaterEqThan(nBits);
    geMin.in[0] <== value;
    geMin.in[1] <== minValue;
    geMin.out === 1;

    // (3) Upper bound: value <= maxValue.
    component leMax = LessEqThan(nBits);
    leMax.in[0] <== value;
    leMax.in[1] <== maxValue;
    leMax.out === 1;
}

component main { public [valueCommitment, minValue, maxValue] } = PaymentProof(32);
