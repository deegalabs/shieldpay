#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Bytes, BytesN, Env};

// Real Groth16/BN254 artifacts generated off-chain from the Circom circuit
// (value=500.00 within range [450.00, 550.00]) and encoded with
// circuits/scripts/encode_bn254_for_soroban.mjs.
const VK_HEX: &str = include_str!("testdata/vk.hex");
const PROOF_HEX: &str = include_str!("testdata/proof.hex");
const PUBLIC_HEX: &str = include_str!("testdata/public.hex");

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

fn setup(env: &Env) -> PaymentVerifierClient<'_> {
    let id = env.register(PaymentVerifier, ());
    PaymentVerifierClient::new(env, &id)
}

#[test]
fn real_proof_verifies_and_records_on_chain() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    client.initialize(&from_hex(&env, VK_HEX));

    let company = Address::generate(&env);
    let worker_hash = BytesN::from_array(&env, &[2u8; 32]);
    let tx_hash = BytesN::from_array(&env, &[3u8; 32]);
    let commitment = BytesN::from_array(&env, &[4u8; 32]);

    // Real on-chain BN254 pairing check runs here.
    let id = client.verify_and_record(
        &company,
        &worker_hash,
        &tx_hash,
        &commitment,
        &from_hex(&env, PROOF_HEX),
        &from_hex(&env, PUBLIC_HEX),
    );
    assert_eq!(id, 0);
    assert!(client.is_verified(&tx_hash));
    assert!(client.get_proof_record(&0).unwrap().verified);
}

#[test]
fn tampered_proof_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    client.initialize(&from_hex(&env, VK_HEX));

    // Flip one byte of the proof -> pairing check must fail.
    let mut proof = from_hex(&env, PROOF_HEX);
    let first = proof.get(0).unwrap();
    proof.set(0, first ^ 0x01);

    let res = client.try_verify_and_record(
        &Address::generate(&env),
        &BytesN::from_array(&env, &[2u8; 32]),
        &BytesN::from_array(&env, &[3u8; 32]),
        &BytesN::from_array(&env, &[4u8; 32]),
        &proof,
        &from_hex(&env, PUBLIC_HEX),
    );
    assert!(res.is_err());
}

#[test]
fn duplicate_payment_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    client.initialize(&from_hex(&env, VK_HEX));

    let company = Address::generate(&env);
    let wh = BytesN::from_array(&env, &[2u8; 32]);
    let tx = BytesN::from_array(&env, &[3u8; 32]);
    let vc = BytesN::from_array(&env, &[4u8; 32]);

    client.verify_and_record(&company, &wh, &tx, &vc, &from_hex(&env, PROOF_HEX), &from_hex(&env, PUBLIC_HEX));
    let res = client.try_verify_and_record(
        &company, &wh, &tx, &vc, &from_hex(&env, PROOF_HEX), &from_hex(&env, PUBLIC_HEX),
    );
    assert!(res.is_err());
}
