pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

/*
 * ShieldPay — Proof-of-Payroll (Groth16 / BN254).
 *
 * The aggregate proof. For a batch of N payments it proves, in zero knowledge:
 *   (1) each commitment_i == Poseidon(value_i, randomness_i)  — binds to the same
 *       commitments recorded per payment, so the batch is the real payroll;
 *   (2) each value_i is within its agreed range [min_i, max_i] — compliance;
 *   (3) sum(value_i) == total — the PUBLIC total is exactly correct.
 *
 * It reveals no individual value_i. This turns the product's headline claim —
 * "prove your total payroll and that everyone was paid in range, without
 * revealing a single salary" — into a single on-chain-verifiable proof, the way
 * proof-of-reserves proves solvency without exposing account-level balances.
 *
 * Runs with a fixed N (pad short runs with zero entries: value=0, min=0, max=0,
 * commitment=Poseidon(0, r_pad); they add 0 to the total). nBits=32 covers any
 * realistic amount in USDC cents.
 *
 *   Private (witness): value[N], randomness[N]
 *   Public:            commitment[N], minValue[N], maxValue[N], total
 */
template PayrollProof(N, nBits) {
    // --- private inputs (never revealed) ---
    signal input value[N];
    signal input randomness[N];

    // --- public inputs ---
    signal input commitment[N];
    signal input minValue[N];
    signal input maxValue[N];
    signal input total;

    // Running sum of the private values, checked against the public total.
    signal sum[N + 1];
    sum[0] <== 0;

    component commit[N];
    component geMin[N];
    component leMax[N];

    for (var i = 0; i < N; i++) {
        // (1) Commitment binding: Poseidon(value_i, randomness_i) == commitment_i.
        commit[i] = Poseidon(2);
        commit[i].inputs[0] <== value[i];
        commit[i].inputs[1] <== randomness[i];
        commit[i].out === commitment[i];

        // (2) Range: min_i <= value_i <= max_i.
        geMin[i] = GreaterEqThan(nBits);
        geMin[i].in[0] <== value[i];
        geMin[i].in[1] <== minValue[i];
        geMin[i].out === 1;

        leMax[i] = LessEqThan(nBits);
        leMax[i].in[0] <== value[i];
        leMax[i].in[1] <== maxValue[i];
        leMax[i].out === 1;

        // (3) Accumulate the private values.
        sum[i + 1] <== sum[i] + value[i];
    }

    // (3) The sum of all values equals the public total.
    sum[N] === total;
}

// N = 8 matches the payroll run cap (max 8 lines); short runs pad with zeros.
component main {
    public [commitment, minValue, maxValue, total]
} = PayrollProof(8, 32);
