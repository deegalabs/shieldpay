# ShieldPay ZK Circuits

The zero-knowledge layer proves a payment is **within the contractual range
`[min, max]` without revealing the exact amount**. It ships in two circuits: a
per-payment range proof (`payment_proof/`) and an aggregate Proof-of-Payroll over
a whole run (`payroll_proof/`).

## Two implementations, one statement

| Path | Status | Why |
| --- | --- | --- |
| **Circom + Groth16** (`payment_proof/`) | **PRIMARY, shipped** | Small proof, single pairing-friendly verifier that fits the Soroban budget on testnet today. One of the three officially endorsed hackathon paths. |
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

## Proof-of-Payroll: the aggregate circuit

`payroll_proof/payroll_proof.circom` proves an entire run in a single Groth16
proof: the amounts sum to a public total AND each amount sits inside its own
agreed range, revealing no individual salary. This is the headline innovation,
proof-of-reserves for payroll.

```
private:  value[8], randomness[8]
public:   commitment[8], minValue[8], maxValue[8], total        // 25 signals

for i in 0..8:
  assert  Poseidon(value[i], randomness[i]) == commitment[i]     // commitment binding
  assert  value[i] >= minValue[i]                                // lower bound
  assert  value[i] <= maxValue[i]                                // upper bound
assert  sum(value) == total                                      // aggregate total
```

The width is fixed at `N = 8`. Runs with fewer lines are padded with zeros so the
circuit shape stays constant. The off-chain prover is `lib/zk/payroll-prover.ts`
(snarkjs), reusing the field encoding in `lib/zk/encode.ts`.

**On-chain binding and honest limits.** The payroll verifier now binds each
non-padding line to a recorded per-payment proof of the same company with a
matching range (commitment index + stored range), so a company cannot aggregate
with invented lines or ranges. The remaining limit we are upfront about: the
worker-cosigned range enforcement protects the honest payment flow, not a company
crafting raw contract calls; binding the real on-chain USDC recipient to the
anchored identity is roadmap.

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

Runtime artifacts (wasm, final zkey, verification key) are committed. Large,
regenerable artifacts (r1cs, ptau) are gitignored.

## Build the Proof-of-Payroll (payroll) artifacts

```bash
scripts/build_payroll.sh    # compile + powers-of-tau + groth16 setup -> target/
```

This produces the payroll circuit's `wasm`, final `zkey`, and
`verification_key.json` under `payroll_proof/target/`. The per-payment circuit is
built by `scripts/setup.sh` / `scripts/ceremony.sh`.

## Two verifier instances

The two circuits verify against two separate on-chain instances of the same
`PaymentVerifier` contract, each initialized with its own verification key: the
per-payment instance and the Proof-of-Payroll instance (testnet id
`CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q`). See
`contracts/README.md` for the on-chain methods.

## Noir reference

```bash
cd noir_reference/payment_proof
nargo test                  # runs the in-range unit test
```

> The trusted setup in `setup.sh` is a fresh local ceremony for the demo. For
> production, use a real multi-party powers-of-tau.
