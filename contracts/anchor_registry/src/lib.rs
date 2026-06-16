#![no_std]
//! AnchorRegistry — binds a worker's Stellar address to their contract metadata.
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
    /// "CPF:<hash>|CONTRACT:42|DATE:2026-06-01" — structured metadata.
    pub metadata: String,
    pub anchored_at_ledger: u32,
    pub anchored_at_timestamp: u64,
}

#[contracttype]
enum DataKey {
    /// Keyed by (worker, company).
    Anchor(Address, Address),
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
