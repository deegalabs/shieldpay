#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Bytes, BytesN, Env};

// Real Groth16/BN254 artifacts generated off-chain from the Circom circuit
// (value=500.00 within range [450.00, 550.00]) and encoded with
// circuits/scripts/encode_bn254_for_soroban.mjs.
const VK_HEX: &str = include_str!("testdata/vk.hex");
const PROOF_HEX: &str = include_str!("testdata/proof.hex");
const PUBLIC_HEX: &str = include_str!("testdata/public.hex");

// Public signal 0 (the value commitment) of the test proof, big-endian. The
// proof is generated with workerAddressHash = [2u8; 32] and paymentTxHash =
// [3u8; 32] (see circuits/scripts/gen_testdata.mjs), so those args bind directly.
const COMMITMENT: [u8; 32] = [
    0x13, 0x43, 0x81, 0xa4, 0xad, 0x74, 0xd3, 0xfb, 0x03, 0x1b, 0x5f, 0xe3, 0x97, 0xd9, 0x17, 0xbe,
    0xee, 0xf3, 0x1b, 0xe4, 0xd6, 0x69, 0x06, 0x22, 0x85, 0x3d, 0x23, 0x0f, 0x49, 0x9a, 0x9a, 0xe4,
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

/// Register a constructor-deployed instance: a fresh admin plus BOTH verification
/// keys (per-payment and aggregate payroll), ready to verify immediately.
fn setup(env: &Env) -> PaymentVerifierClient<'_> {
    let admin = Address::generate(env);
    let id = env.register(
        PaymentVerifier,
        (admin, from_hex(env, VK_HEX), from_hex(env, PAYROLL_VK_HEX)),
    );
    PaymentVerifierClient::new(env, &id)
}

/// Like `setup`, but returns the admin Address and the contract id too, for auth
/// and storage-seeding tests.
fn setup_with_admin(env: &Env) -> (Address, Address, PaymentVerifierClient<'_>) {
    let admin = Address::generate(env);
    let id = env.register(
        PaymentVerifier,
        (admin.clone(), from_hex(env, VK_HEX), from_hex(env, PAYROLL_VK_HEX)),
    );
    (admin, id.clone(), PaymentVerifierClient::new(env, &id))
}

#[test]
fn real_proof_verifies_and_records_on_chain() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    let company = Address::generate(&env);
    let worker_hash = BytesN::from_array(&env, &[2u8; 32]);
    let tx_hash = BytesN::from_array(&env, &[3u8; 32]);
    let commitment = BytesN::from_array(&env, &COMMITMENT);

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

    let company = Address::generate(&env);
    let wh = BytesN::from_array(&env, &[2u8; 32]);
    let tx = BytesN::from_array(&env, &[3u8; 32]);
    let vc = BytesN::from_array(&env, &COMMITMENT);

    client.verify_and_record(&company, &wh, &tx, &vc, &from_hex(&env, PROOF_HEX), &from_hex(&env, PUBLIC_HEX));
    let res = client.try_verify_and_record(
        &company, &wh, &tx, &vc, &from_hex(&env, PROOF_HEX), &from_hex(&env, PUBLIC_HEX),
    );
    assert!(res.is_err());
}

#[test]
fn proof_not_bound_to_recipient_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    // A valid proof, but recorded against a different recipient than the one the
    // proof is bound to (public signal 3). The pairing passes; the binding fails.
    let res = client.try_verify_and_record(
        &Address::generate(&env),
        &BytesN::from_array(&env, &[9u8; 32]), // != public signal 3 ([2u8; 32])
        &BytesN::from_array(&env, &[3u8; 32]),
        &BytesN::from_array(&env, &COMMITMENT),
        &from_hex(&env, PROOF_HEX),
        &from_hex(&env, PUBLIC_HEX),
    );
    assert!(res.is_err());
}

// ─────────────── Aggregate Proof-of-Payroll binding (A1 / P1) ───────────────
//
// Real aggregate artifacts for a run of 3 payments padded to N=8: lines
// [50000 in 45000..55000], [75000 in 70000..80000], [35000 in 30000..40000],
// total 160000; lines 3..7 are zero padding (min == max == 0). Generated by
// circuits/scripts/gen_payroll_testdata.mjs and encoded for Soroban.
const PAYROLL_VK_HEX: &str = include_str!("testdata/payroll_vk.hex");
const PAYROLL_PROOF_HEX: &str = include_str!("testdata/payroll_proof.hex");
const PAYROLL_PUBLIC_HEX: &str = include_str!("testdata/payroll_public.hex");

const COMMIT_0: [u8; 32] = [
    0x29, 0x1a, 0x28, 0xd2, 0x50, 0xcc, 0xf0, 0x7e, 0xf0, 0xe1, 0x50, 0x89, 0x7f, 0x91, 0x63, 0xf8,
    0x65, 0x78, 0x18, 0x7c, 0xba, 0x35, 0x09, 0x90, 0xf8, 0x1a, 0x9d, 0xa5, 0xed, 0x38, 0x79, 0xe3,
];
const COMMIT_1: [u8; 32] = [
    0x2e, 0x96, 0x51, 0xf2, 0x1c, 0x06, 0x7c, 0x70, 0xa3, 0xd0, 0x88, 0x97, 0xd6, 0x89, 0x6b, 0xec,
    0x1f, 0x19, 0xe8, 0x05, 0xb6, 0xf0, 0xac, 0x4e, 0x2d, 0x28, 0x74, 0x8c, 0x5d, 0xa0, 0x26, 0x8a,
];
const COMMIT_2: [u8; 32] = [
    0x29, 0x18, 0xdc, 0x09, 0x7c, 0x24, 0x4b, 0xd6, 0xe8, 0x50, 0x78, 0x4c, 0x3a, 0x4c, 0xc9, 0xfa,
    0x8c, 0x17, 0xda, 0x00, 0x43, 0x01, 0x01, 0x7b, 0x28, 0x72, 0x2a, 0xde, 0x1a, 0xb7, 0xf4, 0x26,
];

/// Seed a per-payment ProofRecord + commitment index directly into contract
/// storage, standing in for a prior verify_and_record call.
fn seed_record(
    env: &Env,
    contract: &Address,
    company: &Address,
    commitment: &BytesN<32>,
    range_min: u64,
    range_max: u64,
    id: u64,
) {
    env.as_contract(contract, || {
        let rec = ProofRecord {
            proof_id: id,
            company: company.clone(),
            worker_address_hash: BytesN::from_array(env, &[0u8; 32]),
            payment_tx_hash: BytesN::from_array(env, &[0u8; 32]),
            value_commitment: commitment.clone(),
            range_min,
            range_max,
            verified: true,
            verified_at_ledger: 0,
            verified_at_timestamp: 0,
        };
        env.storage().persistent().set(&DataKey::Record(id), &rec);
        env.storage()
            .persistent()
            .set(&DataKey::CommitmentIndex(commitment.clone()), &id);
    });
}

fn payroll_setup(env: &Env) -> (Address, PaymentVerifierClient<'_>) {
    let admin = Address::generate(env);
    let id = env.register(
        PaymentVerifier,
        (admin, from_hex(env, VK_HEX), from_hex(env, PAYROLL_VK_HEX)),
    );
    let client = PaymentVerifierClient::new(env, &id);
    (id, client)
}

#[test]
fn payroll_binds_each_line_to_a_recorded_payment() {
    let env = Env::default();
    env.mock_all_auths();
    let (id, client) = payroll_setup(&env);
    let company = Address::generate(&env);

    // The three real payments the aggregate proof covers, recorded with the same
    // ranges the proof declares.
    seed_record(&env, &id, &company, &BytesN::from_array(&env, &COMMIT_0), 45000, 55000, 0);
    seed_record(&env, &id, &company, &BytesN::from_array(&env, &COMMIT_1), 70000, 80000, 1);
    seed_record(&env, &id, &company, &BytesN::from_array(&env, &COMMIT_2), 30000, 40000, 2);

    let run_ref = BytesN::from_array(&env, &[7u8; 32]);
    let pid = client.verify_and_record_payroll(
        &company,
        &run_ref,
        &160000u64,
        &from_hex(&env, PAYROLL_PROOF_HEX),
        &from_hex(&env, PAYROLL_PUBLIC_HEX),
    );
    assert!(client.get_payroll_record(&pid).unwrap().verified);
}

#[test]
fn payroll_rejects_a_line_whose_recorded_range_differs() {
    let env = Env::default();
    env.mock_all_auths();
    let (id, client) = payroll_setup(&env);
    let company = Address::generate(&env);

    // Line 0 recorded with a WIDER range than the proof declares (45000..55000):
    // a company trying to pass off a wider range than it individually proved.
    seed_record(&env, &id, &company, &BytesN::from_array(&env, &COMMIT_0), 1, 999_999, 0);
    seed_record(&env, &id, &company, &BytesN::from_array(&env, &COMMIT_1), 70000, 80000, 1);
    seed_record(&env, &id, &company, &BytesN::from_array(&env, &COMMIT_2), 30000, 40000, 2);

    let res = client.try_verify_and_record_payroll(
        &company,
        &BytesN::from_array(&env, &[7u8; 32]),
        &160000u64,
        &from_hex(&env, PAYROLL_PROOF_HEX),
        &from_hex(&env, PAYROLL_PUBLIC_HEX),
    );
    assert!(res.is_err());
}

#[test]
fn payroll_rejects_a_line_with_no_recorded_payment() {
    let env = Env::default();
    env.mock_all_auths();
    let (id, client) = payroll_setup(&env);
    let company = Address::generate(&env);

    // Only two of the three real lines are recorded; the third has no payment.
    seed_record(&env, &id, &company, &BytesN::from_array(&env, &COMMIT_0), 45000, 55000, 0);
    seed_record(&env, &id, &company, &BytesN::from_array(&env, &COMMIT_1), 70000, 80000, 1);

    let res = client.try_verify_and_record_payroll(
        &company,
        &BytesN::from_array(&env, &[7u8; 32]),
        &160000u64,
        &from_hex(&env, PAYROLL_PROOF_HEX),
        &from_hex(&env, PAYROLL_PUBLIC_HEX),
    );
    assert!(res.is_err());
}

#[test]
fn payroll_rejects_lines_recorded_by_a_different_company() {
    let env = Env::default();
    env.mock_all_auths();
    let (id, client) = payroll_setup(&env);
    let company = Address::generate(&env);
    let other = Address::generate(&env);

    // The payments were recorded by `other`, not the company proving the run.
    seed_record(&env, &id, &other, &BytesN::from_array(&env, &COMMIT_0), 45000, 55000, 0);
    seed_record(&env, &id, &other, &BytesN::from_array(&env, &COMMIT_1), 70000, 80000, 1);
    seed_record(&env, &id, &other, &BytesN::from_array(&env, &COMMIT_2), 30000, 40000, 2);

    let res = client.try_verify_and_record_payroll(
        &company,
        &BytesN::from_array(&env, &[7u8; 32]),
        &160000u64,
        &from_hex(&env, PAYROLL_PROOF_HEX),
        &from_hex(&env, PAYROLL_PUBLIC_HEX),
    );
    assert!(res.is_err());
}

// ─────────────── A+ proof of reserves (treasury coverage) ───────────────

/// Seed the 3 real payment records and a USDC SAC with `balance` for `company`,
/// then run the aggregate; returns the recorded `covered` flag.
fn run_with_treasury(env: &Env, id: &Address, client: &PaymentVerifierClient, company: &Address, balance: i128) -> bool {
    seed_record(env, id, company, &BytesN::from_array(env, &COMMIT_0), 45000, 55000, 0);
    seed_record(env, id, company, &BytesN::from_array(env, &COMMIT_1), 70000, 80000, 1);
    seed_record(env, id, company, &BytesN::from_array(env, &COMMIT_2), 30000, 40000, 2);

    let sac = env.register_stellar_asset_contract_v2(Address::generate(env));
    soroban_sdk::token::StellarAssetClient::new(env, &sac.address()).mint(company, &balance);
    client.set_treasury_asset(&sac.address());

    let pid = client.verify_and_record_payroll(
        company,
        &BytesN::from_array(env, &[7u8; 32]),
        &160000u64,
        &from_hex(env, PAYROLL_PROOF_HEX),
        &from_hex(env, PAYROLL_PUBLIC_HEX),
    );
    client.get_payroll_record(&pid).unwrap().covered
}

#[test]
fn payroll_records_treasury_coverage_true() {
    let env = Env::default();
    env.mock_all_auths();
    let (id, client) = payroll_setup(&env);
    let company = Address::generate(&env);
    // Treasury holds 200000 cents >= run total 160000 -> covered.
    assert!(run_with_treasury(&env, &id, &client, &company, 20_000_000_000));
}

#[test]
fn payroll_records_treasury_shortfall() {
    let env = Env::default();
    env.mock_all_auths();
    let (id, client) = payroll_setup(&env);
    let company = Address::generate(&env);
    // Treasury holds only 100000 cents < run total 160000 -> not covered.
    assert!(!run_with_treasury(&env, &id, &client, &company, 10_000_000_000));
}

// ─────────────── A1 Tier 2: worker-cosigned range enforcement ───────────────
//
// Minimal AnchorRegistry stand-ins that answer get_range with a fixed value, so
// the PaymentVerifier's cross-contract enforcement can be tested in isolation.
// (The real AnchorRegistry's RangeAnchor is a structurally identical type in
// another crate; the on-chain deploy validates that cross-crate path.)

#[soroban_sdk::contract]
pub struct MockAnchorMatch;
#[soroban_sdk::contractimpl]
impl MockAnchorMatch {
    pub fn get_range(_e: Env, _h: BytesN<32>, _c: Address) -> Option<RangeAnchor> {
        Some(RangeAnchor { range_min: 45000, range_max: 55000 }) // == the test proof's range
    }
}

#[soroban_sdk::contract]
pub struct MockAnchorMismatch;
#[soroban_sdk::contractimpl]
impl MockAnchorMismatch {
    pub fn get_range(_e: Env, _h: BytesN<32>, _c: Address) -> Option<RangeAnchor> {
        Some(RangeAnchor { range_min: 1, range_max: 999_999 }) // != the test proof's range
    }
}

#[soroban_sdk::contract]
pub struct MockAnchorNone;
#[soroban_sdk::contractimpl]
impl MockAnchorNone {
    pub fn get_range(_e: Env, _h: BytesN<32>, _c: Address) -> Option<RangeAnchor> {
        None
    }
}

/// Records the standard test proof (range 45000..55000) with `anchor` configured
/// as the AnchorRegistry; returns whether verify_and_record succeeded.
fn record_ok_with_anchor(env: &Env, anchor: &Address) -> bool {
    let client = setup(env);
    client.set_anchor_registry(anchor);
    client
        .try_verify_and_record(
            &Address::generate(env),
            &BytesN::from_array(env, &[2u8; 32]),
            &BytesN::from_array(env, &[3u8; 32]),
            &BytesN::from_array(env, &COMMITMENT),
            &from_hex(env, PROOF_HEX),
            &from_hex(env, PUBLIC_HEX),
        )
        .is_ok()
}

#[test]
fn per_payment_accepts_a_proof_matching_the_anchored_range() {
    let env = Env::default();
    env.mock_all_auths();
    let anchor = env.register(MockAnchorMatch, ());
    assert!(record_ok_with_anchor(&env, &anchor));
}

#[test]
fn per_payment_rejects_a_range_the_worker_did_not_cosign() {
    let env = Env::default();
    env.mock_all_auths();
    let anchor = env.register(MockAnchorMismatch, ());
    assert!(!record_ok_with_anchor(&env, &anchor));
}

#[test]
fn per_payment_proceeds_when_no_range_is_anchored() {
    let env = Env::default();
    env.mock_all_auths();
    let anchor = env.register(MockAnchorNone, ());
    // No cosigned range -> graceful fallback -> the payment still records.
    assert!(record_ok_with_anchor(&env, &anchor));
}

// ─────────────── M1 hardening: admin auth, dedup, canonical inputs ───────────────

#[test]
fn non_admin_set_treasury_asset_rejected() {
    let env = Env::default();
    let (_admin, _id, client) = setup_with_admin(&env);
    let sac = Address::generate(&env);

    // No admin authorization present -> the require_auth gate rejects the call.
    env.mock_auths(&[]);
    assert!(client.try_set_treasury_asset(&sac).is_err());

    // With the admin's authorization -> the call is allowed.
    env.mock_all_auths();
    assert!(client.try_set_treasury_asset(&sac).is_ok());
}

#[test]
fn non_admin_set_anchor_registry_rejected() {
    let env = Env::default();
    let (_admin, _id, client) = setup_with_admin(&env);
    let registry = Address::generate(&env);

    // No admin authorization present -> rejected.
    env.mock_auths(&[]);
    assert!(client.try_set_anchor_registry(&registry).is_err());

    // With the admin's authorization -> allowed.
    env.mock_all_auths();
    assert!(client.try_set_anchor_registry(&registry).is_ok());
}

#[test]
fn duplicate_commitment_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    let company = Address::generate(&env);
    let wh = BytesN::from_array(&env, &[2u8; 32]);
    let tx = BytesN::from_array(&env, &[3u8; 32]);
    let vc = BytesN::from_array(&env, &COMMITMENT);

    client.verify_and_record(&company, &wh, &tx, &vc, &from_hex(&env, PROOF_HEX), &from_hex(&env, PUBLIC_HEX));

    // Same commitment, a different tx hash: the CommitmentIndex must not be
    // overwritten, so the second record is rejected with DuplicateCommitment.
    let tx2 = BytesN::from_array(&env, &[8u8; 32]);
    let res = client.try_verify_and_record(
        &company, &wh, &tx2, &vc, &from_hex(&env, PROOF_HEX), &from_hex(&env, PUBLIC_HEX),
    );
    assert_eq!(res, Err(Ok(Error::DuplicateCommitment)));
}

#[test]
fn non_canonical_public_input_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    // Force the first public signal to 0xFF..FF (>= the BN254 scalar modulus),
    // making it a non-canonical field element. It must be rejected before the
    // pairing runs.
    let mut public = from_hex(&env, PUBLIC_HEX);
    for i in 4u32..36 {
        public.set(i, 0xFF);
    }

    let res = client.try_verify_and_record(
        &Address::generate(&env),
        &BytesN::from_array(&env, &[2u8; 32]),
        &BytesN::from_array(&env, &[3u8; 32]),
        &BytesN::from_array(&env, &COMMITMENT),
        &from_hex(&env, PROOF_HEX),
        &public,
    );
    assert_eq!(res, Err(Ok(Error::NonCanonicalInput)));
}
