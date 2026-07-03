#![no_std]
//! IncomeVerifier — verifies a Groth16 zk-SNARK income credential and records it.
//!
//! Feature F1, "proof of income". A worker proves, in zero knowledge, that ONE
//! specific employer (a public BabyJubJub key) signed six monthly amounts whose
//! SUM lies in a claimed [rangeMin, rangeMax], revealing no single amount. The
//! nullifier = Poseidon(secret, verifierId) makes each presentation unlinkable
//! across verifiers and replay-safe within one verifier: shown twice to the same
//! verifier the nullifier collides, so the second presentation is rejected here.
//!
//! ZK verification is REAL and on-chain: the Groth16 pairing check runs inside
//! the contract using Stellar's native BN254 host functions (Protocol 25/26),
//! exposed through `soroban_sdk::crypto::bn254`. The circuit is Circom + snarkjs
//! (BN254). VK/proof/public bytes are produced off-chain by
//! `circuits/scripts/encode_bn254_for_soroban.mjs`.
//!
//! Public signal order (frozen by the circuit):
//!   [0] nullifier, [1] employerAx, [2] employerAy, [3] workerId,
//!   [4] rangeMin, [5] rangeMax, [6] verifierId
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
    vec, Bytes, BytesN, Env, Vec, U256,
};

#[derive(Clone)]
#[contracttype]
pub struct CredentialRecord {
    pub id: u64,
    // The presentation's nullifier (public signal 0). Unique per credential and
    // verifier session; used to reject a second presentation to this verifier.
    pub nullifier: BytesN<32>,
    // Employer BabyJubJub public key (signals 1 and 2). Identifies who attested
    // the income, kept as raw field elements.
    pub employer_ax: BytesN<32>,
    pub employer_ay: BytesN<32>,
    // Worker identity bound into every signed record (signal 3).
    pub worker_id: BytesN<32>,
    // The claimed range the proven sum was shown to fall within (signals 4, 5).
    pub range_min: u64,
    pub range_max: u64,
    // The verifier session id the nullifier is scoped to (signal 6).
    pub verifier_id: BytesN<32>,
    pub verified: bool,
    pub verified_at_ledger: u32,
    pub verified_at_timestamp: u64,
}

#[contracttype]
enum DataKey {
    Vk,
    NextId,
    Record(u64),
    // nullifier -> credential id, so a repeat presentation is detected before any
    // pairing work is done.
    NullifierIndex(BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidProof = 3,
    AlreadyPresented = 4,
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

/// Read the public signal at `index` as a u64. Ranges are small USDC-cent
/// amounts, so the high 24 bytes of the field element must be zero.
fn public_signal_u64(env: &Env, public_signals: &Bytes, index: u32) -> Result<u64, Error> {
    let arr = public_signal(env, public_signals, index)?.to_array();
    let mut hi = 0u8;
    for b in arr.iter().take(24) {
        hi |= *b;
    }
    if hi != 0 {
        return Err(Error::MalformedPublicSignals);
    }
    let mut low = [0u8; 8];
    low.copy_from_slice(&arr[24..32]);
    Ok(u64::from_be_bytes(low))
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
pub struct IncomeVerifier;

#[contractimpl]
impl IncomeVerifier {
    /// Store the income circuit's verification key (encoded by the off-chain
    /// encoder). Parsed once here so a malformed key fails fast and cannot be
    /// stored. First write wins; an admin gate is a separate future task.
    pub fn initialize(env: Env, vk_bytes: Bytes) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Vk) {
            return Err(Error::AlreadyInitialized);
        }
        let _ = VerificationKey::from_bytes(&env, &vk_bytes)?;
        env.storage().instance().set(&DataKey::Vk, &vk_bytes);
        env.storage().instance().set(&DataKey::NextId, &0u64);
        Ok(())
    }

    /// Verify an income credential proof on-chain and, if valid and unseen,
    /// record it. Returns the credential id.
    ///
    /// `nullifier` is the presentation's nullifier (public signal 0). It is both
    /// the replay key (a repeat is rejected with `AlreadyPresented`) and bound to
    /// the proof: it must equal signal 0, else `ProofNotBound`. This stops a
    /// caller recording a valid proof under a nullifier that is not its own.
    pub fn verify_and_record_credential(
        env: Env,
        nullifier: BytesN<32>,
        proof: Bytes,
        public_signals: Bytes,
    ) -> Result<u64, Error> {
        let vk_bytes: Bytes = env
            .storage()
            .instance()
            .get(&DataKey::Vk)
            .ok_or(Error::NotInitialized)?;

        // 1) Replay guard: reject a nullifier already presented to this verifier.
        if env
            .storage()
            .persistent()
            .has(&DataKey::NullifierIndex(nullifier.clone()))
        {
            return Err(Error::AlreadyPresented);
        }

        let vk = VerificationKey::from_bytes(&env, &vk_bytes)?;
        let parsed_proof = Groth16Proof::from_bytes(&env, &proof)?;
        let signals = parse_public_signals(&env, &public_signals)?;

        // 2) Real on-chain BN254 pairing check over all 7 signals.
        if !verify_groth16(&env, &vk, &parsed_proof, &signals)? {
            return Err(Error::InvalidProof);
        }

        // 3) Bind: the passed nullifier must equal the proof's nullifier output.
        if public_signal(&env, &public_signals, 0)? != nullifier {
            return Err(Error::ProofNotBound);
        }

        // 4) Store. Employer key, worker id and verifier id stay as raw field
        // elements; the two ranges decode to u64.
        let employer_ax = public_signal(&env, &public_signals, 1)?;
        let employer_ay = public_signal(&env, &public_signals, 2)?;
        let worker_id = public_signal(&env, &public_signals, 3)?;
        let range_min = public_signal_u64(&env, &public_signals, 4)?;
        let range_max = public_signal_u64(&env, &public_signals, 5)?;
        let verifier_id = public_signal(&env, &public_signals, 6)?;

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        let record = CredentialRecord {
            id,
            nullifier: nullifier.clone(),
            employer_ax,
            employer_ay,
            worker_id,
            range_min,
            range_max,
            verifier_id,
            verified: true,
            verified_at_ledger: env.ledger().sequence(),
            verified_at_timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::Record(id), &record);
        env.storage()
            .persistent()
            .set(&DataKey::NullifierIndex(nullifier), &id);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        Ok(id)
    }

    /// Whether a nullifier has already been presented (and recorded).
    pub fn is_presented(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::NullifierIndex(nullifier))
    }

    /// Fetch a full credential record by id.
    pub fn get_credential(env: Env, id: u64) -> Option<CredentialRecord> {
        env.storage().persistent().get(&DataKey::Record(id))
    }
}

#[cfg(test)]
mod test;
