#![cfg(test)]
use super::*;
use soroban_sdk::{Bytes, BytesN, Env};

// Real Groth16/BN254 artifacts generated off-chain from the Circom income
// credential circuit (six employer-signed monthly amounts summing to 3022100
// cents, proven within the claimed range [3000000, 3100000]) and encoded with
// circuits/scripts/encode_bn254_for_soroban.mjs. Regenerate with:
//   node circuits/scripts/gen_income_testdata.mjs
//   node circuits/scripts/encode_bn254_for_soroban.mjs vk|proof|public <file>
const VK_HEX: &str = include_str!("testdata/income_vk.hex");
const PROOF_HEX: &str = include_str!("testdata/income_proof.hex");
const PUBLIC_HEX: &str = include_str!("testdata/income_public.hex");

// Public signal 0 (the nullifier) of the test proof, big-endian. Must equal the
// value passed to verify_and_record_credential for the proof to bind.
const NULLIFIER: [u8; 32] = [
    0x1a, 0x28, 0x58, 0xec, 0x10, 0x74, 0x1c, 0xd5, 0xb9, 0xbe, 0x34, 0xb7, 0xd3, 0xf1, 0xf2, 0xa7,
    0x2c, 0x88, 0x12, 0xa6, 0x1b, 0x85, 0x48, 0x92, 0x21, 0x82, 0x87, 0x89, 0xe2, 0x7b, 0xff, 0x63,
];

fn hexval(c: u8) -> u8 {
    match c {
        b'0'..=b'9' => c - b'0',
        b'a'..=b'f' => c - b'a' + 10,
        b'A'..=b'F' => c - b'A' + 10,
        _ => 0,
    }
}

fn from_hex(env: &Env, s: &str) -> Bytes {
    let b = s.as_bytes();
    let mut out = Bytes::new(env);
    let mut i = 0;
    while i + 1 < b.len() {
        out.push_back(hexval(b[i]) * 16 + hexval(b[i + 1]));
        i += 2;
    }
    out
}

fn setup(env: &Env) -> IncomeVerifierClient<'_> {
    let id = env.register(IncomeVerifier, ());
    IncomeVerifierClient::new(env, &id)
}

#[test]
fn real_proof_verifies_and_records_on_chain() {
    let env = Env::default();
    let client = setup(&env);
    client.initialize(&from_hex(&env, VK_HEX));

    let nullifier = BytesN::from_array(&env, &NULLIFIER);

    // Real on-chain BN254 pairing check runs here.
    let id = client.verify_and_record_credential(
        &nullifier,
        &from_hex(&env, PROOF_HEX),
        &from_hex(&env, PUBLIC_HEX),
    );
    assert_eq!(id, 0);
    assert!(client.is_presented(&nullifier));

    let rec = client.get_credential(&0).unwrap();
    assert!(rec.verified);
    assert_eq!(rec.nullifier, nullifier);
    // Ranges decoded from signals 4 and 5.
    assert_eq!(rec.range_min, 3_000_000);
    assert_eq!(rec.range_max, 3_100_000);
}

#[test]
fn tampered_proof_is_rejected() {
    let env = Env::default();
    let client = setup(&env);
    client.initialize(&from_hex(&env, VK_HEX));

    // Swap the two G1 points of the proof (A at [0,64) with C at [192,256)).
    // Both stay valid curve points, so parsing succeeds, but the pairing check
    // must fail -> a clean InvalidProof rather than a malformed-point abort.
    let orig = from_hex(&env, PROOF_HEX);
    let mut proof = orig.clone();
    for i in 0..64u32 {
        proof.set(i, orig.get(192 + i).unwrap());
        proof.set(192 + i, orig.get(i).unwrap());
    }

    let res = client.try_verify_and_record_credential(
        &BytesN::from_array(&env, &NULLIFIER),
        &proof,
        &from_hex(&env, PUBLIC_HEX),
    );
    assert_eq!(res, Err(Ok(Error::InvalidProof)));
}

#[test]
fn same_nullifier_twice_is_rejected() {
    let env = Env::default();
    let client = setup(&env);
    client.initialize(&from_hex(&env, VK_HEX));

    let nullifier = BytesN::from_array(&env, &NULLIFIER);
    client.verify_and_record_credential(
        &nullifier,
        &from_hex(&env, PROOF_HEX),
        &from_hex(&env, PUBLIC_HEX),
    );

    // Second presentation of the same nullifier to this verifier is a replay.
    let res = client.try_verify_and_record_credential(
        &nullifier,
        &from_hex(&env, PROOF_HEX),
        &from_hex(&env, PUBLIC_HEX),
    );
    assert_eq!(res, Err(Ok(Error::AlreadyPresented)));
}

#[test]
fn wrong_nullifier_arg_is_rejected() {
    let env = Env::default();
    let client = setup(&env);
    client.initialize(&from_hex(&env, VK_HEX));

    // A valid proof, but presented under a nullifier that is not signal 0. The
    // pairing passes; the binding check fails.
    let res = client.try_verify_and_record_credential(
        &BytesN::from_array(&env, &[9u8; 32]),
        &from_hex(&env, PROOF_HEX),
        &from_hex(&env, PUBLIC_HEX),
    );
    assert_eq!(res, Err(Ok(Error::ProofNotBound)));
}
