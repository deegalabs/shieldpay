# ShieldPay: Pitch

A slide outline plus a 2 to 3 minute spoken script for the Stellar Hacks: ZK
submission. Keep it honest and concrete. The strongest asset is Proof-of-Payroll:
one zero-knowledge proof over a whole run proves the total and range compliance
without revealing a single salary, verified on-chain in a Soroban contract. It is
real and live on testnet, so show it, do not just claim it.

## Slide outline (10 slides)

**1. Title.**
ShieldPay. Confidential payroll on Stellar. Private by default, auditable on
demand, verifiable by anyone.

**2. The problem.**
On-chain payroll publishes every salary. A rival reads the ledger and poaches
your best engineer with the number in hand. DAOs and Web3 teams want to pay
contributors on-chain, but salaries are private, and on a transparent chain the
amount is public to the whole world. Today the choice is bad: pay in the open and
leak every salary, or move off-chain and lose the proof.

**3. The solution.**
ShieldPay pays contributors with the amount kept as a commitment, proves on-chain
that each payment was within the agreed range, and lets the company disclose the
exact figure only to an authorized auditor. Recipient visible, amount hidden.

**4. The headline: Proof-of-Payroll (what makes this novel).**
After a payroll run, ShieldPay generates one zero-knowledge proof over the whole
run. It proves two things at once: the individual amounts sum to a public total,
and each amount sits inside its agreed range. It reveals no single salary. Think
of it as proof-of-reserves, for payroll. This is the differentiator. It turns the
headline claim, "prove your total and range compliance without revealing
salaries," from a promise into on-chain math. Remove the ZK and the product does
not exist.

**5. Why ZK is load-bearing.**
The promise is "prove the payment was correct without revealing the salary." That
is a zero-knowledge statement. A Groth16 proof over BN254 shows: the amount is in
the agreed range, it matches a Poseidon commitment, and it is bound to this
recipient and this settlement transaction. The aggregate proof extends the same
math to the entire run.

**6. How it works.**
Off-chain: the browser builds the commitment and the proof (the server never sees
the amount). On-chain: a Soroban contract verifies the Groth16 proof with
Stellar's native BN254 pairing and records it. The settlement is a real,
recipient-visible transaction bound to the proof. A viewing key lets an auditor
reveal and re-verify amounts against the on-chain commitments.

**7. It is real, not a slide.**
Show the live testnet transaction on stellar.expert: the payroll verifier
contract (`CDHKKXVEVZSGDVLSH2L3ZPCCO6KUVGBAQMV6J6DDNVEGD5F6N4QHEW2Q`) verifying
the aggregate Proof-of-Payroll with Stellar's native BN254 pairing, plus
verify_and_record on the PaymentVerifier contract, verified true, with the
recipient hash, settlement tx hash, and amount commitment, none of which reveal
the salary. Anyone can re-run `get_proof_record` against the live contract. The
whole thing is live at https://web-production-f389ce.up.railway.app with a
one-click demo login (Acme DAO paying Jane Doe, a verified payment, and an
aggregate Proof-of-Payroll).

**8. Honest privacy model and limitation.**
We are explicit: the recipient and the fact of payment are public; the amount is
private. The settlement posts a symbolic marker over the USDC rail, because
moving the real figure in clear would leak it. The exact amount lives in the
commitment and is disclosed only under the viewing key. On honesty: the aggregate
now binds each line back to a recorded payment with a matching range on-chain (so a
company cannot invent ranges), and the worker co-signs their range. The limit we
are upfront about is that this range enforcement protects the honest payment flow,
not a company crafting raw contract calls; binding the real on-chain recipient
closes that, and is roadmap.

**9. Why Stellar.**
Native USDC and real payment rails (MoneyGram, anchors, PIX off-ramp on the
roadmap). Protocol 25 and 26 put BN254 and Poseidon in the host layer, so SNARK
verification is cheap on-chain. We use the proven Circom and Groth16 path.

**10. Status and ask.**
Working end to end on testnet and live: three portals (company, worker, auditor),
seedless auth, non-custodial signing (the company can sign its own on-chain calls
with its Privy wallet, custodial server-signer as fallback), the aggregate
Proof-of-Payroll verified on-chain, selective disclosure, receipts. Multi-party
trusted setup scripted. Roadmap: fiat on and off ramp, mainnet, and binding the
aggregate to the per-line records. ShieldPay makes confidential payroll real on
Stellar.

## Proof at a glance (tables for judges)

How it compares:

| | Raw USDC payroll | Shielded wallet | ShieldPay |
| --- | --- | --- | --- |
| Amount private | no | yes | yes |
| Recipient visible / auditable | yes | no | yes |
| Provably correct on-chain | no | partial | yes |
| Selective disclosure to an auditor | no | rare | yes |
| One aggregate proof for a whole run | no | no | yes |

Rejection paths (each guarantee maps to a real on-chain error, reproducible with
`pnpm demo`):

| Guarantee | Mechanism | On-chain rejection |
| --- | --- | --- |
| A forged proof cannot be recorded | BN254 pairing check | `InvalidProof` (#3) |
| A payment cannot be replayed | tx-hash / run-ref dedup | `DuplicatePayment` (#4) |
| A proof cannot be rebound to another recipient, commitment, or tx | signals 0/3/4 bound to the record | `ProofNotBound` (#8) |
| An aggregate line must be a real recorded payment with a matching range | commitment to record index plus stored range | `ProofNotBound` (#8) |

## Spoken script (2 to 3 minutes)

> A DAO wants to pay its contributors on-chain. But salaries are private, and on a
> transparent chain the amount is public to everyone. So today teams either leak
> every salary, or go off-chain and lose the proof.
>
> ShieldPay fixes that. You run payroll, and each amount is kept as a commitment.
> A zero-knowledge proof shows the payment was within the agreed range, without
> revealing the figure, and it is verified inside a Stellar smart contract.
>
> Here is what makes it novel. After the run, we generate one proof over the whole
> payroll. It proves the amounts add up to a public total, and that every one is
> inside its agreed range, without revealing a single salary. Proof-of-reserves,
> for payroll.
>
> And it is real. This is a live testnet transaction. A Soroban contract verified
> the aggregate proof with Stellar's native BN254 pairing, then recorded it:
> verified, with the recipient and the commitment, and nowhere does the amount
> appear. Anyone can re-verify it. I will be honest about one limit: today the
> on-chain aggregate binds the total, not yet each line back to its record, so
> range compliance still trusts the prover. That binding is our next step.
>
> We are honest about the model. The recipient is public, the amount is private.
> And when an accountant needs the numbers, the company shares a viewing-key link.
> The auditor sees the exact amounts, each one re-derived against the same
> commitment the chain checked, so it is provable, not trust-me. The company can
> revoke that access in one click.
>
> It works end to end on testnet: three portals, seedless sign-in, the on-chain
> proof, selective disclosure, and a receipt anyone can verify. ShieldPay:
> confidential payroll on Stellar. Private by default, auditable on demand,
> verifiable by anyone.

## Delivery notes

- Lead with Proof-of-Payroll, then the live on-chain proof; that pair is the
  credibility moment.
- Say "honest" out loud when you cover the privacy model and the aggregate
  binding limitation. Judges reward candor.
- Keep jargon for slides 4 to 6 only; the rest is plain language.
- End on the one-liner, not on a roadmap slide.
