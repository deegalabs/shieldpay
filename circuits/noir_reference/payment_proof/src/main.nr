// ShieldPay — Payment range proof (Noir REFERENCE implementation).
//
// This is the human-readable reference for the proof statement. The PRIMARY,
// shipped circuit is the Circom version (../../payment_proof/payment_proof.circom)
// because the Groth16 verifier is the path that fits the Soroban budget on
// testnet today. UltraHonk proofs (Noir's default backend) are larger and
// currently localnet-only on Soroban — see docs/ARCHITECTURE.md, Decision 1.
//
// Kept here because Noir reads far closer to the business intent, and because
// a Noir -> Groth16 backend (BN254) is a viable future swap.

use std::hash::poseidon;

fn main(
    // private (witness)
    value: Field,
    value_randomness: Field,
    // public
    value_commitment: pub Field,
    min_value: pub u64,
    max_value: pub u64,
) {
    // (1) Commitment binding: Poseidon(value, randomness) == value_commitment.
    let computed = poseidon::bn254::hash_2([value, value_randomness]);
    assert(computed == value_commitment);

    // (2) Range: min_value <= value <= max_value.
    let v = value as u64;
    assert(v >= min_value);
    assert(v <= max_value);
}

#[test]
fn test_in_range() {
    // value within [min, max]; commitment computed for the same pair.
    let value: Field = 50000;
    let randomness: Field = 123456789;
    let commitment = poseidon::bn254::hash_2([value, randomness]);
    main(value, randomness, commitment, 45000, 55000);
}
