#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Bytes, BytesN, Env, Vec};

fn setup(env: &Env) -> PaymentVerifierClient<'_> {
    let contract_id = env.register(PaymentVerifier, ());
    PaymentVerifierClient::new(env, &contract_id)
}

#[test]
fn initialize_then_verify_and_record() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    client.initialize(&Bytes::from_array(&env, &[1u8; 64]));

    let company = Address::generate(&env);
    let worker_hash = BytesN::from_array(&env, &[2u8; 32]);
    let tx_hash = BytesN::from_array(&env, &[3u8; 32]);
    let commitment = BytesN::from_array(&env, &[4u8; 32]);
    let proof = Bytes::from_array(&env, &[5u8; 128]);
    let mut inputs = Vec::new(&env);
    inputs.push_back(BytesN::from_array(&env, &[6u8; 32]));

    let id = client.verify_and_record(
        &company, &worker_hash, &tx_hash, &commitment, &proof, &inputs,
    );
    assert_eq!(id, 0);
    assert!(client.is_verified(&tx_hash));

    let record = client.get_proof_record(&0).unwrap();
    assert!(record.verified);
    assert_eq!(record.payment_tx_hash, tx_hash);
}

#[test]
fn duplicate_payment_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    client.initialize(&Bytes::from_array(&env, &[1u8; 64]));

    let company = Address::generate(&env);
    let worker_hash = BytesN::from_array(&env, &[2u8; 32]);
    let tx_hash = BytesN::from_array(&env, &[3u8; 32]);
    let commitment = BytesN::from_array(&env, &[4u8; 32]);
    let proof = Bytes::from_array(&env, &[5u8; 128]);
    let mut inputs = Vec::new(&env);
    inputs.push_back(BytesN::from_array(&env, &[6u8; 32]));

    client.verify_and_record(&company, &worker_hash, &tx_hash, &commitment, &proof, &inputs);
    let res = client.try_verify_and_record(
        &company, &worker_hash, &tx_hash, &commitment, &proof, &inputs,
    );
    assert!(res.is_err());
}
