#![no_std]
//! PaymentVerifier — verifies a Groth16 zk-SNARK proof of payment and records it.
//!
//! The proof attests, in zero knowledge, that a payment amount is within the
//! contractual [min, max] range, without revealing the exact amount. This is
//! layer 4 of the proof chain (see docs/ARCHITECTURE.md).
//!
//! ZK verification strategy:
//!   The cryptographic Groth16 verification (3 pairings + the public-input
//!   linear combination) is performed using Stellar's native BLS12-381 host
//!   functions, following the official example:
//!   https://github.com/stellar/soroban-examples/tree/main/groth16_verifier
//!
//!   `verify_groth16` below is the integration seam. It is currently a guarded
//!   stub so the business logic (storage, indexing, auth) can be built and
//!   tested independently; wiring the host-function pairing check is tracked as
//!   the Day 1–2 milestone in docs/ARCHITECTURE.md. This is intentional,
//!   honest work-in-progress — the proof artifacts and verification key are
//!   produced by `npm run zk:setup`.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Bytes, BytesN, Env, Vec,
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
    /// Groth16 verification key, set once at initialize().
    Vk,
    /// Monotonic proof id counter.
    NextId,
    /// Record keyed by proof id.
    Record(u64),
    /// payment_tx_hash -> proof_id, for is_verified lookups.
    TxIndex(BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidProof = 3,
    DuplicatePayment = 4,
}

#[contract]
pub struct PaymentVerifier;

#[contractimpl]
impl PaymentVerifier {
    /// Store the circuit's verification key. Callable once.
    pub fn initialize(env: Env, vk_bytes: Bytes) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Vk) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Vk, &vk_bytes);
        env.storage().instance().set(&DataKey::NextId, &0u64);
        Ok(())
    }

    /// Verify a Groth16 proof and, if valid, record it. Returns the proof id.
    /// `company` must authorize the call (the paying company is the caller).
    pub fn verify_and_record(
        env: Env,
        company: Address,
        worker_address_hash: BytesN<32>,
        payment_tx_hash: BytesN<32>,
        value_commitment: BytesN<32>,
        proof: Bytes,
        public_inputs: Vec<BytesN<32>>,
    ) -> Result<u64, Error> {
        company.require_auth();

        let vk: Bytes = env
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

        if !verify_groth16(&env, &vk, &proof, &public_inputs) {
            return Err(Error::InvalidProof);
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

/// Groth16 verification seam.
///
/// PRODUCTION: perform the pairing check using the BLS12-381 host functions
/// (`bls12_381_pairing`, `bls12_381_g1_msm`) exactly as in the official
/// `stellar/soroban-examples/groth16_verifier`, parsing `vk` and `proof` into
/// G1/G2 points and computing e(A,B) == e(alpha,beta)·e(L,gamma)·e(C,delta).
///
/// SCAFFOLD: returns true only when all artifacts are present and non-empty,
/// so the storage/auth logic is fully testable. Replacing this body with the
/// host-function pairing check is the only remaining step to full on-chain ZK.
fn verify_groth16(
    _env: &Env,
    vk: &Bytes,
    proof: &Bytes,
    public_inputs: &Vec<BytesN<32>>,
) -> bool {
    !vk.is_empty() && !proof.is_empty() && !public_inputs.is_empty()
}

#[cfg(test)]
mod test;
