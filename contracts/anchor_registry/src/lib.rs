#![no_std]
//! AnchorRegistry, binds a worker's Stellar address to their contract metadata.
//!
//! The worker self-anchors (the call must be authorized by the worker's own
//! address), producing an immutable, timestamped declaration of
//! address <-> legal-identity ownership. This is layer 2 of the proof chain
//! (see docs/ARCHITECTURE.md) and survives even if the ShieldPay app disappears.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, String,
};

#[derive(Clone)]
#[contracttype]
pub struct AnchorData {
    /// sha256 of the signed contract PDF.
    pub contract_hash: BytesN<32>,
    /// "CPF:<hash>|CONTRACT:42|DATE:2026-06-01", structured metadata.
    pub metadata: String,
    pub anchored_at_ledger: u32,
    pub anchored_at_timestamp: u64,
}

/// The contractual payment range the worker co-signed at anchor time. Keyed by
/// the worker's address hash (the same field element the payment proof binds as
/// public signal 3), so the PaymentVerifier can read the authoritative range for
/// a payment without knowing the worker's full address.
#[derive(Clone)]
#[contracttype]
pub struct RangeAnchor {
    pub range_min: u64,
    pub range_max: u64,
}

#[contracttype]
enum DataKey {
    /// Keyed by (worker, company).
    Anchor(Address, Address),
    /// Keyed by (worker_address_hash, company). The worker-cosigned range.
    Range(BytesN<32>, Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    AlreadyAnchored = 1,
}

#[contract]
pub struct AnchorRegistry;

#[contractimpl]
impl AnchorRegistry {
    /// Register the caller's own address against a company + contract.
    /// `worker` must authorize this call (self-anchor only).
    pub fn anchor(
        env: Env,
        worker: Address,
        company: Address,
        contract_hash: BytesN<32>,
        metadata: String,
    ) -> Result<(), Error> {
        worker.require_auth();

        let key = DataKey::Anchor(worker.clone(), company.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyAnchored);
        }

        let data = AnchorData {
            contract_hash,
            metadata,
            anchored_at_ledger: env.ledger().sequence(),
            anchored_at_timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&key, &data);
        Ok(())
    }

    /// Like `anchor`, but the worker also co-signs the agreed payment range,
    /// stored under the worker's address hash so the PaymentVerifier can later
    /// enforce that every payment proof uses exactly this range. Both the worker
    /// AND the company must authorize the call, and the range is write-once per
    /// (worker address hash, company): once set it cannot be overwritten. That
    /// stops a company from re-pointing an already anchored worker's hash at a
    /// wider range with a throwaway co-signer. `worker_address_hash` is the same
    /// field element the payment circuit exposes as public signal 3, and it is a
    /// caller-supplied argument: the write-once guard blocks the overwrite, but
    /// the residual case (a company front-running a worker's very first anchor
    /// for a hash not yet registered) is closed only by binding the on-chain
    /// recipient to the anchored identity, which is roadmap.
    pub fn anchor_with_range(
        env: Env,
        worker: Address,
        company: Address,
        contract_hash: BytesN<32>,
        metadata: String,
        worker_address_hash: BytesN<32>,
        range_min: u64,
        range_max: u64,
    ) -> Result<(), Error> {
        worker.require_auth();
        company.require_auth();

        let key = DataKey::Anchor(worker.clone(), company.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyAnchored);
        }
        // Write-once on the range too. The range key uses the caller-supplied
        // worker address hash, so without this guard a company could overwrite
        // an existing worker's range using a throwaway co-signing worker.
        let range_key = DataKey::Range(worker_address_hash, company.clone());
        if env.storage().persistent().has(&range_key) {
            return Err(Error::AlreadyAnchored);
        }
        let data = AnchorData {
            contract_hash,
            metadata,
            anchored_at_ledger: env.ledger().sequence(),
            anchored_at_timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&key, &data);
        env.storage()
            .persistent()
            .set(&range_key, &RangeAnchor { range_min, range_max });
        Ok(())
    }

    /// The worker-cosigned range for a payment identity, if one was anchored.
    pub fn get_range(env: Env, worker_address_hash: BytesN<32>, company: Address) -> Option<RangeAnchor> {
        env.storage()
            .persistent()
            .get(&DataKey::Range(worker_address_hash, company))
    }

    /// Whether `worker` is anchored for `company`.
    pub fn is_anchored(env: Env, worker: Address, company: Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Anchor(worker, company))
    }

    /// Fetch the anchor record, if any.
    pub fn get_anchor(env: Env, worker: Address, company: Address) -> Option<AnchorData> {
        env.storage()
            .persistent()
            .get(&DataKey::Anchor(worker, company))
    }
}

#[cfg(test)]
mod test;
