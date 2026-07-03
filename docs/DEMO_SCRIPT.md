# ShieldPay: Demo Video Script (2 to 3 min)

Goal: show the product working and make clear what the ZK proof does. You do not
need to appear on camera. Read the narration as voice-over while screen-recording
the actions. Keep it honest: recipient visible, amount hidden, settlement marker
symbolic, proof verified on-chain.

Tip: open the live app at https://web-production-f389ce.up.railway.app, use the
one-click demo login (an isolated demo identity, seeded as Acme DAO paying Jane
Doe), have a fresh browser profile ready for the auditor link, and keep the
stellar.expert tab pre-opened on the payroll verifier contract
(`CC2LBLFIXG3BUPS436E4MYCDJ36DB2AX66IZIWBE2VVMU4M4C4TTIYCQ`).

---

## [0:00 to 0:15] The hook (landing)

On screen: the landing page.

> "A DAO wants to pay its contributors on-chain. But salaries are private, and on
> a transparent chain the amount is public to everyone. ShieldPay settles the
> payment for real, proves the whole run was correct, and keeps every figure
> private."

## [0:15 to 0:30] Sign in (one-click demo)

On screen: click the one-click demo login and land in the company portal.

> "One click signs you in to a demo company, Acme DAO. No seed phrase, no
> extension. It is an isolated demo identity, so you can try everything live."

## [0:30 to 0:50] Company dashboard

On screen: the dashboard, with verified proofs, the contributor list, and recent
payments. Point at the "amounts are private" line.

> "This is the company view: verified proofs, contributors, recent payments. Every
> amount here is a commitment, not a number. The figures stay private by default,
> even to anyone reading the chain."

## [0:50 to 1:05] Contributors (anchored on-chain)

On screen: open Contributors, show Jane Doe with the on-chain identity anchor.

> "Each contributor signs a one-time identity anchor on Stellar that binds their
> wallet to the agreement. That is what lets a payment later map back to a real
> person and range."

## [1:05 to 1:40] Run payroll live

On screen: start a run, fill an amount for Jane Doe, click "Run payroll & prove".
Show the progress state as it settles, proves, and verifies.

> "Now payroll. I fill an amount and click run and prove. The browser turns the
> amount into a commitment and builds a zero-knowledge proof. It is generated, and
> then verified inside a Stellar smart contract, in real time, proving the amount
> is within the agreed range without printing it. The server never sees the
> figure."

On-screen callout while the run progresses: "settle, prove, verify".

## [1:40 to 2:05] The run detail: Proof-of-Payroll

On screen: open the run detail and show the Proof-of-Payroll block: the total
proven, salaries hidden, and the link to the on-chain proof.

> "Here is what makes it novel. One proof covers the whole run. It proves the
> amounts sum to this public total, and that each one is inside its range, without
> revealing a single salary. Proof-of-reserves, for payroll. The link opens the
> proof on-chain. One honest limit: today the aggregate binds the total, not yet
> each line back to its record, so range compliance still trusts the prover. That
> binding is our next step."

## [2:05 to 2:25] Receipts and the on-chain proof (strong)

On screen: open Receipts, then follow through to the pre-opened stellar.expert
tab on the payroll verifier contract.
1. Show that each payment carries a re-verifiable on-chain proof.
2. On stellar.expert, show the verification recorded with Stellar's native BN254
   pairing: verified, with the recipient hash, settlement tx hash, and amount
   commitment. None reveal the salary.
3. Optionally show the terminal running the README "verify it yourself" command:
   `get_proof_record` returning the same record.

> "This is not a mock. Every receipt carries a proof that was checked on-chain
> with Stellar's native pairing, then recorded. Anyone can re-verify it. The
> amount never appears."

## [2:25 to 2:50] Selective disclosure (auditor)

On screen:
1. As the company, mint a viewing-key auditor link.
2. Open it in the fresh profile, no wallet. The exact amounts appear.
3. Highlight that each amount re-derives the same commitment the contract
   checked, with a reconciled total. Export the CSV.
4. Back in the company topbar, click "Revoke disclosure" and reload the auditor
   link: it drops to read-only.

> "When an accountant needs the numbers, the company shares a viewing-key link. No
> wallet needed, and the exact amounts appear, each one re-verified against the
> same on-chain commitment. And the company can revoke that access in one click."

## [2:50 to 3:00] Close

On screen: back to the dashboard.

> "ShieldPay. Private payroll you can prove. Confidential payroll on Stellar,
> built on zero-knowledge proofs."

---

### Pre-flight checklist (do this before recording)

- [ ] Latest commits pushed and the Railway deploy is live at
      https://web-production-f389ce.up.railway.app.
- [ ] One-click demo login working, seeded as Acme DAO paying Jane Doe with a
      verified payment and an aggregate Proof-of-Payroll.
- [ ] Contracts deployed to testnet, IDs in the env; `addresses.json` current.
- [ ] One real testnet run captured end to end, with a real stellar.expert link.
- [ ] Optional, for the USDC rail on screen: run `pnpm setup:usdc` so the
      treasury holds USDC and the settlement shows the USDC asset, not the XLM
      marker.
- [ ] stellar.expert pre-opened on the payroll verifier contract
      (`CC2LBLFIXG3BUPS436E4MYCDJ36DB2AX66IZIWBE2VVMU4M4C4TTIYCQ`) to avoid dead
      air.

### One-line value proposition (for the submission text)

Confidential payroll on Stellar: pay contributors, prove on-chain with one
Proof-of-Payroll that the run totals up and each amount was in range, keep every
figure private, and disclose it only to an authorized auditor.
