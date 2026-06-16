# ShieldPay ZK Circuits

The zero-knowledge layer proves a payment is **within the contractual range
`[min, max]` without revealing the exact amount**.

## Two implementations, one statement

| Path | Status | Why |
| --- | --- | --- |
| **Circom + Groth16** (`payment_proof/`) | **PRIMARY — shipped** | Small proof, single pairing-friendly verifier that fits the Soroban budget on testnet today. One of the three officially endorsed hackathon paths. |
| **Noir** (`noir_reference/`) | Reference / stretch | Reads closest to the business intent. Default UltraHonk backend is larger and currently localnet-only on Soroban; a Noir→Groth16 (BN254) swap is a future option. |

This mirrors CLAUDE.md Decision 1: start readable (Noir), ship what verifies on
testnet (Groth16).

## The proof statement

```
private:  value, valueRandomness
public:   valueCommitment, minValue, maxValue

assert  Poseidon(value, valueRandomness) == valueCommitment   // commitment binding
assert  value >= minValue                                     // lower bound
assert  value <= maxValue                                     // upper bound
```

`value` is in **USDC cents** (e.g. $500.00 → 50000).

## Build the primary (Circom) artifacts

```bash
npm install                 # installs circomlib + circomlibjs
npm run zk:setup            # compile + trusted setup -> target/
npm run zk:prove -- --value 50000 --min 45000 --max 55000
```

Runtime artifacts produced (consumed by `lib/zk/prover.ts` and the verifier
contract):

- `payment_proof/target/payment_proof_js/payment_proof.wasm`
- `payment_proof/target/payment_proof_final.zkey`
- `payment_proof/target/verification_key.json` *(committed)*

## Noir reference

```bash
cd noir_reference/payment_proof
nargo test                  # runs the in-range unit test
```

> The trusted setup in `setup.sh` is a fresh local ceremony for the demo. For
> production, use a real multi-party powers-of-tau.
