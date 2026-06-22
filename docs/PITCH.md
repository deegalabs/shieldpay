# ShieldPay: Pitch

A slide outline plus a 2 to 3 minute spoken script for the Stellar Hacks: ZK
submission. Keep it honest and concrete. The strongest asset is that the ZK is
real and verified on-chain, so show that, do not just claim it.

## Slide outline (9 slides)

**1. Title.**
ShieldPay. Confidential payroll on Stellar. Private by default, auditable on
demand, verifiable by anyone.

**2. The problem.**
DAOs and Web3 teams want to pay contributors on-chain. But salaries are private,
and on a transparent chain the amount is public to the whole world. Today the
choice is bad: pay in the open and leak every salary, or move off-chain and lose
the proof.

**3. The solution.**
ShieldPay pays contributors with the amount kept as a commitment, proves on-chain
that each payment was within the agreed range, and lets the company disclose the
exact figure only to an authorized auditor. Recipient visible, amount hidden.

**4. Why ZK is load-bearing (the core).**
The promise is "prove the payment was correct without revealing the salary." That
is a zero-knowledge statement. A Groth16 proof shows: the amount is in the agreed
range, it matches a Poseidon commitment, and it is bound to this recipient and
this settlement transaction. Remove the ZK and the product does not exist.

**5. How it works.**
Off-chain: the browser builds the commitment and the proof (the server never sees
the amount). On-chain: a Soroban contract verifies the Groth16 proof with
Stellar's native BN254 pairing and records it. The settlement is a real,
recipient-visible transaction bound to the proof. A viewing key lets an auditor
reveal and re-verify amounts against the on-chain commitments.

**6. It is real, not a slide.**
Show the live testnet transaction on stellar.expert: verify_and_record on the
PaymentVerifier contract, verified true, with the recipient hash, settlement tx
hash, and amount commitment, none of which reveal the salary. Anyone can re-run
`get_proof_record` against the live contract.

**7. Honest privacy model.**
We are explicit: the recipient and the fact of payment are public; the amount is
private. The settlement posts a symbolic marker over the USDC rail, because
moving the real figure in clear would leak it. The exact amount lives in the
commitment and is disclosed only under the viewing key.

**8. Why Stellar.**
Native USDC and real payment rails (MoneyGram, anchors, PIX off-ramp on the
roadmap). Protocol 25 and 26 put BN254 and Poseidon in the host layer, so SNARK
verification is cheap on-chain. We use the proven Circom and Groth16 path.

**9. Status and ask.**
Working end to end on testnet: three portals (company, worker, auditor), seedless
auth, on-chain proof, selective disclosure, receipts. Multi-party trusted setup
scripted. Roadmap: fiat on and off ramp, mainnet, deeper in-circuit binding.
ShieldPay makes confidential payroll real on Stellar.

## Spoken script (2 to 3 minutes)

> A DAO wants to pay its contributors on-chain. But salaries are private, and on a
> transparent chain the amount is public to everyone. So today teams either leak
> every salary, or go off-chain and lose the proof.
>
> ShieldPay fixes that. You run payroll, and each amount is kept as a commitment.
> A zero-knowledge proof shows the payment was within the agreed range, without
> revealing the figure, and it is verified inside a Stellar smart contract.
>
> Here is the part that matters: the ZK is doing the work, and it is real. This is
> a live testnet transaction. The contract verified a Groth16 proof with Stellar's
> native pairing, then recorded it: verified, with the recipient and the
> commitment, and nowhere does the amount appear. Anyone can re-verify it.
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

- Lead with the live on-chain proof; it is the credibility moment.
- Say "honest" out loud when you cover the privacy model. Judges reward candor.
- Keep jargon for slide 4 to 5 only; the rest is plain language.
- End on the one-liner, not on a roadmap slide.
