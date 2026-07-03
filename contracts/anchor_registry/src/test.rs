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

#[test]
fn anchor_with_range_stores_cosigned_range() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AnchorRegistry, ());
    let client = AnchorRegistryClient::new(&env, &contract_id);

    let worker = Address::generate(&env);
    let company = Address::generate(&env);
    let worker_hash = BytesN::from_array(&env, &[5u8; 32]);
    let metadata = String::from_str(&env, "CPF:abc|CONTRACT:42");

    // No range before anchoring.
    assert!(client.get_range(&worker_hash, &company).is_none());

    client.anchor_with_range(
        &worker,
        &company,
        &BytesN::from_array(&env, &[7u8; 32]),
        &metadata,
        &worker_hash,
        &45000,
        &55000,
    );

    // The range is readable by (worker_hash, company), and the plain anchor exists.
    let r = client.get_range(&worker_hash, &company).unwrap();
    assert_eq!(r.range_min, 45000);
    assert_eq!(r.range_max, 55000);
    assert!(client.is_anchored(&worker, &company));
    // A different company sees no range for the same worker hash.
    assert!(client.get_range(&worker_hash, &Address::generate(&env)).is_none());
}
