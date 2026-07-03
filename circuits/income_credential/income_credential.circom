pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/eddsaposeidon.circom";

/*
 * ShieldPay — Income Credential (Groth16 / BN254).
 *
 * Feature F1, "proof of income". A worker proves that ONE specific employer
 * (identified by a public BabyJubJub public key) paid them, over N months, a
 * set of monthly amounts whose SUM lies in a claimed range [rangeMin, rangeMax],
 * WITHOUT revealing any single monthly amount.
 *
 * Two bindings make a leaked credential useless and each presentation unique:
 *   - workerId is folded into every signed record, so the employer's signatures
 *     only validate for THIS worker. A stolen (amount, month, signature) set
 *     cannot be replayed under a different workerId.
 *   - the nullifier = Poseidon(secret, verifierId) is deterministic per
 *     (worker secret, verifier session). The same credential shown to two
 *     verifiers yields two unlinkable nullifiers; shown twice to the same
 *     verifier it collides, so the verifier can reject replays.
 *
 * For each month i the employer signed msg[i] = Poseidon(amount[i], month[i],
 * workerId) with EdDSA-Poseidon. Verifying those signatures in-circuit is what
 * makes the amounts employer-attested rather than self-claimed. This is the
 * foundation of F1: it freezes the public-signal layout below.
 *
 * PUBLIC SIGNAL ORDER (snarkjs: outputs first, then public inputs in
 * declaration order):
 *   [0] nullifier    (output)
 *   [1] employerAx   (public input)
 *   [2] employerAy   (public input)
 *   [3] workerId     (public input)
 *   [4] rangeMin     (public input)
 *   [5] rangeMax     (public input)
 *   [6] verifierId   (public input)
 *
 *   Private (witness): amount[N], month[N], sigR8[N][2], sigS[N], secret
 *
 * nBits = 40 covers a year of salary in USDC cents (2^40 ≈ $10.99B). The sum of
 * N realistic monthly amounts stays well under 2^40, which the range comparators
 * require (GreaterEqThan/LessEqThan assume both operands fit in nBits).
 */
template IncomeCredential(N, nBits) {
    // --- private inputs (never revealed) ---
    signal input amount[N];      // USDC cents paid in month i
    signal input month[N];       // month index, e.g. YYYYMM as a field
    signal input sigR8[N][2];    // employer EdDSA signature R8 point per record
    signal input sigS[N];        // employer EdDSA signature scalar per record
    signal input secret;         // nullifier seed, known only to the worker

    // --- public inputs ---
    signal input employerAx;     // employer BabyJubJub public key X
    signal input employerAy;     // employer BabyJubJub public key Y
    signal input workerId;       // binds the credential to this worker
    signal input rangeMin;       // claimed lower bound of the income sum
    signal input rangeMax;       // claimed upper bound of the income sum
    signal input verifierId;     // identifies who the credential is shown to

    // --- public output ---
    signal output nullifier;     // Poseidon(secret, verifierId)

    // Running sum of the private monthly amounts.
    signal sum[N + 1];
    sum[0] <== 0;

    component msg[N];
    component sig[N];

    for (var i = 0; i < N; i++) {
        // (1) Reconstruct the exact tuple the employer signed. Folding workerId
        //     in binds the record to this worker.
        msg[i] = Poseidon(3);
        msg[i].inputs[0] <== amount[i];
        msg[i].inputs[1] <== month[i];
        msg[i].inputs[2] <== workerId;

        // (2) The employer's EdDSA-Poseidon signature over msg[i] must verify
        //     under the public employer key. This is what makes the amounts
        //     employer-attested, not self-claimed.
        sig[i] = EdDSAPoseidonVerifier();
        sig[i].enabled <== 1;
        sig[i].Ax <== employerAx;
        sig[i].Ay <== employerAy;
        sig[i].S <== sigS[i];
        sig[i].R8x <== sigR8[i][0];
        sig[i].R8y <== sigR8[i][1];
        sig[i].M <== msg[i].out;

        // (3) Accumulate the private amounts.
        sum[i + 1] <== sum[i] + amount[i];
    }

    // Range: rangeMin <= sum <= rangeMax, without revealing sum.
    component geMin = GreaterEqThan(nBits);
    geMin.in[0] <== sum[N];
    geMin.in[1] <== rangeMin;
    geMin.out === 1;

    component leMax = LessEqThan(nBits);
    leMax.in[0] <== sum[N];
    leMax.in[1] <== rangeMax;
    leMax.out === 1;

    // Nullifier: deterministic per (worker secret, verifier session).
    component nf = Poseidon(2);
    nf.inputs[0] <== secret;
    nf.inputs[1] <== verifierId;
    nullifier <== nf.out;
}

// N = 6 monthly records; nBits = 40 (USDC cents, a year of salary fits).
component main {
    public [employerAx, employerAy, workerId, rangeMin, rangeMax, verifierId]
} = IncomeCredential(6, 40);
