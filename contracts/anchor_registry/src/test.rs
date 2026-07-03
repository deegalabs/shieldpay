#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    BytesN, Env, IntoVal, String,
};

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

#[test]
fn anchor_with_range_requires_company_cosign() {
    let env = Env::default();

    let contract_id = env.register(AnchorRegistry, ());
    let client = AnchorRegistryClient::new(&env, &contract_id);

    let worker = Address::generate(&env);
    let company = Address::generate(&env);
    let worker_hash = BytesN::from_array(&env, &[5u8; 32]);
    let contract_hash = BytesN::from_array(&env, &[7u8; 32]);
    let metadata = String::from_str(&env, "CPF:abc|CONTRACT:42");

    // Only the worker authorizes; the company does NOT co-sign. The company
    // require_auth gate must reject the anchor.
    env.mock_auths(&[MockAuth {
        address: &worker,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "anchor_with_range",
            args: (
                worker.clone(),
                company.clone(),
                contract_hash.clone(),
                metadata.clone(),
                worker_hash.clone(),
                45000u64,
                55000u64,
            )
                .into_val(&env),
            sub_invokes: &[],
        },
    }]);
    let res = client.try_anchor_with_range(
        &worker,
        &company,
        &contract_hash,
        &metadata,
        &worker_hash,
        &45000,
        &55000,
    );
    assert!(res.is_err());
    // Nothing was written when the co-signature was missing.
    assert!(client.get_range(&worker_hash, &company).is_none());
    assert!(!client.is_anchored(&worker, &company));

    // With both authorizations present, the same anchor succeeds.
    env.mock_all_auths();
    client.anchor_with_range(
        &worker,
        &company,
        &contract_hash,
        &metadata,
        &worker_hash,
        &45000,
        &55000,
    );
    assert!(client.get_range(&worker_hash, &company).is_some());
}

#[test]
fn company_cannot_overwrite_an_existing_range() {
    // Regression for H1: a company must not be able to widen an already anchored
    // worker's range by re-registering the same worker address hash with a
    // throwaway co-signing worker it controls. The range is write-once.
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AnchorRegistry, ());
    let client = AnchorRegistryClient::new(&env, &contract_id);

    let worker = Address::generate(&env);
    let company = Address::generate(&env);
    let worker_hash = BytesN::from_array(&env, &[5u8; 32]);
    let contract_hash = BytesN::from_array(&env, &[7u8; 32]);
    let metadata = String::from_str(&env, "CPF:abc|CONTRACT:42");

    // The real worker anchors a tight range.
    client.anchor_with_range(
        &worker,
        &company,
        &contract_hash,
        &metadata,
        &worker_hash,
        &45000,
        &55000,
    );

    // The company spins up a throwaway worker it controls and tries to overwrite
    // the SAME (worker_hash, company) range with a wide one. Both auths pass
    // (mock_all_auths), but the write-once guard must reject it.
    let dummy_worker = Address::generate(&env);
    let res = client.try_anchor_with_range(
        &dummy_worker,
        &company,
        &contract_hash,
        &metadata,
        &worker_hash,
        &1,
        &999_999,
    );
    assert!(res.is_err());

    // The original tight range is intact.
    let r = client.get_range(&worker_hash, &company).unwrap();
    assert_eq!(r.range_min, 45000);
    assert_eq!(r.range_max, 55000);
}
