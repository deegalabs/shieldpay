#![no_std]
//! PaymentVerifier — verifies a Groth16 zk-SNARK proof of payment and records it.
//!
//! The proof attests, in zero knowledge, that a payment amount is within the
//! contractual [min, max] range, without revealing the exact amount. This is
//! layer 4 of the proof chain (see docs/ARCHITECTURE.md).
//!
//! ZK verification is REAL and on-chain: the Groth16 pairing check runs inside
//! the contract using Stellar's native BN254 host functions (Protocol 25/26),
//! exposed through `soroban_sdk::crypto::bn254`. The circuit is Circom + snarkjs
//! (BN254). VK/proof/public bytes are produced off-chain by
//! `circuits/scripts/encode_bn254_for_soroban.mjs`.
//!
//! Verification equation (rearranged to a single multi-pairing == 1 in GT):
//!   e(-A, B) · e(alpha, beta) · e(vk_x, gamma) · e(C, delta) == 1
//! where vk_x = IC[0] + sum_i (public_i · IC[i+1]).

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    crypto::bn254::{
        Bn254Fr, Bn254G1Affine, Bn254G2Affine, BN254_G1_SERIALIZED_SIZE,
        BN254_G2_SERIALIZED_SIZE,
    },
    vec, Address, Bytes, BytesN, Env, Vec, U256,
};

#[derive(Clone)]
#[contracttype]
pub struct ProofRecord {
    pub proof_id: u64,
    pub company: Address,
    pub worker_address_hash: BytesN<32>,
    pub payment_tx_hash: BytesN<32>,
    pub value_commitment: BytesN<32>,
    pub verified: bool,
    pub verified_at_ledger: u32,
    pub verified_at_timestamp: u64,
}

#[contracttype]
enum DataKey {
    Vk,
    NextId,
    Record(u64),
    TxIndex(BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidProof = 3,
    DuplicatePayment = 4,
    MalformedVerifyingKey = 5,
    MalformedProof = 6,
    MalformedPublicSignals = 7,
    ProofNotBound = 8,
}

/// Read the 32-byte public signal at `index` (after the u32 length prefix).
fn public_signal(env: &Env, public_signals: &Bytes, index: u32) -> Result<BytesN<32>, Error> {
    let start = 4 + index * 32;
    let end = start.checked_add(32).ok_or(Error::MalformedPublicSignals)?;
    if end > public_signals.len() {
        return Err(Error::MalformedPublicSignals);
    }
    let mut arr = [0u8; 32];
    public_signals.slice(start..end).copy_into_slice(&mut arr);
    Ok(BytesN::from_array(env, &arr))
}

// ─────────────────────────── Groth16 / BN254 ───────────────────────────

/// Read N bytes from `bytes` at `*pos`, advancing the cursor.
fn take<const N: usize>(bytes: &Bytes, pos: &mut u32, err: Error) -> Result<[u8; N], Error> {
    let end = pos.checked_add(N as u32).ok_or(err)?;
    if end > bytes.len() {
        return Err(err);
    }
    let mut arr = [0u8; N];
    bytes.slice(*pos..end).copy_into_slice(&mut arr);
    *pos = end;
    Ok(arr)
}

fn g1(env: &Env, arr: [u8; BN254_G1_SERIALIZED_SIZE]) -> Bn254G1Affine {
    Bn254G1Affine::from_bytes(BytesN::from_array(env, &arr))
}

fn g2(env: &Env, arr: [u8; BN254_G2_SERIALIZED_SIZE]) -> Bn254G2Affine {
    Bn254G2Affine::from_bytes(BytesN::from_array(env, &arr))
}

struct VerificationKey {
    alpha: Bn254G1Affine,
    beta: Bn254G2Affine,
    gamma: Bn254G2Affine,
    delta: Bn254G2Affine,
    ic: Vec<Bn254G1Affine>,
}

impl VerificationKey {
    fn from_bytes(env: &Env, bytes: &Bytes) -> Result<Self, Error> {
        let e = Error::MalformedVerifyingKey;
        let mut pos = 0u32;
        let alpha = g1(env, take::<BN254_G1_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let beta = g2(env, take::<BN254_G2_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let gamma = g2(env, take::<BN254_G2_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let delta = g2(env, take::<BN254_G2_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let ic_len = u32::from_be_bytes(take::<4>(bytes, &mut pos, e)?);
        let mut ic = Vec::new(env);
        for _ in 0..ic_len {
            ic.push_back(g1(env, take::<BN254_G1_SERIALIZED_SIZE>(bytes, &mut pos, e)?));
        }
        if pos != bytes.len() || ic_len == 0 {
            return Err(e);
        }
        Ok(Self { alpha, beta, gamma, delta, ic })
    }
}

struct Groth16Proof {
    a: Bn254G1Affine,
    b: Bn254G2Affine,
    c: Bn254G1Affine,
}

impl Groth16Proof {
    fn from_bytes(env: &Env, bytes: &Bytes) -> Result<Self, Error> {
        let e = Error::MalformedProof;
        let mut pos = 0u32;
        let a = g1(env, take::<BN254_G1_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let b = g2(env, take::<BN254_G2_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let c = g1(env, take::<BN254_G1_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        if pos != bytes.len() {
            return Err(e);
        }
        Ok(Self { a, b, c })
    }
}

fn parse_public_signals(env: &Env, bytes: &Bytes) -> Result<Vec<Bn254Fr>, Error> {
    let e = Error::MalformedPublicSignals;
    let mut pos = 0u32;
    let len = u32::from_be_bytes(take::<4>(bytes, &mut pos, e)?);
    let mut signals = Vec::new(env);
    for _ in 0..len {
        let arr = take::<32>(bytes, &mut pos, e)?;
        let u = U256::from_be_bytes(env, &Bytes::from_array(env, &arr));
        signals.push_back(Bn254Fr::from_u256(u));
    }
    if pos != bytes.len() {
        return Err(e);
    }
    Ok(signals)
}

/// Run the Groth16 pairing check. Returns Ok(true) iff the proof is valid.
fn verify_groth16(
    env: &Env,
    vk: &VerificationKey,
    proof: &Groth16Proof,
    public_signals: &Vec<Bn254Fr>,
) -> Result<bool, Error> {
    if public_signals.len() + 1 != vk.ic.len() {
        return Err(Error::MalformedVerifyingKey);
    }
    let bn = env.crypto().bn254();

    // vk_x = IC[0] + sum_i (public_i * IC[i+1])
    let mut vk_x = vk.ic.get(0).unwrap();
    for (s, point) in public_signals.iter().zip(vk.ic.iter().skip(1)) {
        vk_x = bn.g1_add(&vk_x, &bn.g1_mul(&point, &s));
    }

    // e(-A,B) · e(alpha,beta) · e(vk_x,gamma) · e(C,delta) == 1
    let neg_a = -proof.a.clone();
    let vp1 = vec![env, neg_a, vk.alpha.clone(), vk_x, proof.c.clone()];
    let vp2 = vec![env, proof.b.clone(), vk.beta.clone(), vk.gamma.clone(), vk.delta.clone()];
    Ok(bn.pairing_check(vp1, vp2))
}

// ─────────────────────────── Contract ───────────────────────────

#[contract]
pub struct PaymentVerifier;

#[contractimpl]
impl PaymentVerifier {
    /// Store the circuit's verification key (encoded by the off-chain encoder).
    /// Parsed once here so a malformed key fails fast and cannot be stored.
    pub fn initialize(env: Env, vk_bytes: Bytes) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Vk) {
            return Err(Error::AlreadyInitialized);
        }
        let _ = VerificationKey::from_bytes(&env, &vk_bytes)?;
        env.storage().instance().set(&DataKey::Vk, &vk_bytes);
        env.storage().instance().set(&DataKey::NextId, &0u64);
        Ok(())
    }

    /// Verify a Groth16 proof on-chain and, if valid, record it. Returns proof id.
    /// `company` must authorize the call.
    pub fn verify_and_record(
        env: Env,
        company: Address,
        worker_address_hash: BytesN<32>,
        payment_tx_hash: BytesN<32>,
        value_commitment: BytesN<32>,
        proof: Bytes,
        public_signals: Bytes,
    ) -> Result<u64, Error> {
        company.require_auth();

        let vk_bytes: Bytes = env
            .storage()
            .instance()
            .get(&DataKey::Vk)
            .ok_or(Error::NotInitialized)?;

        if env
            .storage()
            .persistent()
            .has(&DataKey::TxIndex(payment_tx_hash.clone()))
        {
            return Err(Error::DuplicatePayment);
        }

        let vk = VerificationKey::from_bytes(&env, &vk_bytes)?;
        let parsed_proof = Groth16Proof::from_bytes(&env, &proof)?;
        let signals = parse_public_signals(&env, &public_signals)?;

        if !verify_groth16(&env, &vk, &parsed_proof, &signals)? {
            return Err(Error::InvalidProof);
        }

        // Bind the recorded values to the proof: the public signals for the
        // commitment (0), recipient (3), and settlement tx (4) must equal what is
        // being recorded, so a valid proof cannot be reused for a different
        // recipient or transaction.
        if public_signal(&env, &public_signals, 0)? != value_commitment
            || public_signal(&env, &public_signals, 3)? != worker_address_hash
            || public_signal(&env, &public_signals, 4)? != payment_tx_hash
        {
            return Err(Error::ProofNotBound);
        }

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        let record = ProofRecord {
            proof_id: id,
            company,
            worker_address_hash,
            payment_tx_hash: payment_tx_hash.clone(),
            value_commitment,
            verified: true,
            verified_at_ledger: env.ledger().sequence(),
            verified_at_timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::Record(id), &record);
        env.storage()
            .persistent()
            .set(&DataKey::TxIndex(payment_tx_hash), &id);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        Ok(id)
    }

    /// Whether a payment tx has a recorded, verified proof.
    pub fn is_verified(env: Env, payment_tx_hash: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::TxIndex(payment_tx_hash))
    }

    /// Fetch a full proof record by id.
    pub fn get_proof_record(env: Env, proof_id: u64) -> Option<ProofRecord> {
        env.storage().persistent().get(&DataKey::Record(proof_id))
    }
}

#[cfg(test)]
mod test;
