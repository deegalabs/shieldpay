#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, BytesN, Env, String};

#[test]
fn anchor_and_query() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AnchorRegistry, ());
    let client = AnchorRegistryClient::new(&env, &contract_id);

    let worker = Address::generate(&env);
    let company = Address::generate(&env);
    let contract_hash = BytesN::from_array(&env, &[7u8; 32]);
    let metadata = String::from_str(&env, "CPF:abc|CONTRACT:42|DATE:2026-06-01");

    assert!(!client.is_anchored(&worker, &company));

    client.anchor(&worker, &company, &contract_hash, &metadata);

    assert!(client.is_anchored(&worker, &company));
    let data = client.get_anchor(&worker, &company).unwrap();
    assert_eq!(data.contract_hash, contract_hash);
}

#[test]
fn double_anchor_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AnchorRegistry, ());
    let client = AnchorRegistryClient::new(&env, &contract_id);

    let worker = Address::generate(&env);
    let company = Address::generate(&env);
    let contract_hash = BytesN::from_array(&env, &[1u8; 32]);
    let metadata = String::from_str(&env, "x");

    client.anchor(&worker, &company, &contract_hash, &metadata);
    let res = client.try_anchor(&worker, &company, &contract_hash, &metadata);
    assert!(res.is_err());
}
