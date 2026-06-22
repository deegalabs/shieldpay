# ShieldPay: Demo Video Script (2 to 3 min)

Goal: show the product working and make clear what the ZK proof does. You do not
need to appear on camera. Read the narration as voice-over while screen-recording
the actions. Keep it honest: recipient visible, amount hidden, settlement marker
symbolic, proof verified on-chain.

Tip: have two browser profiles ready (company, and a fresh one for the
contributor and the auditor link) and the stellar.expert tab pre-opened on the
PaymentVerifier contract.

---

## [0:00 to 0:18] The hook

On screen: the landing page, then the dashboard.

> "A DAO wants to pay its contributors on-chain. But salaries are private, and on
> a transparent chain the amount is public to everyone. ShieldPay settles the
> payment for real, proves it was correct, and keeps the figure private."

## [0:18 to 0:40] Why ZK (kept short)

On screen: the dashboard with the "amounts are private" line visible.

> "The proof is doing the work. A zero-knowledge proof lets anyone confirm a
> payment was inside the agreed range, without revealing the amount. The exact
> figure is disclosed only to an auditor the company authorizes."

## [0:40 to 1:05] Onboarding (fast)

On screen, click through:
1. Sign in with email or the one-click demo. No seed phrase, no extension.
2. Invite a contributor, copy the invite link.
3. In the second profile, open the link: a Stellar wallet is created, the
   contributor fills name and tax id, and signs the on-chain identity anchor.

> "Sign-in is seedless through Privy. The contributor gets a Stellar wallet and
> signs a one-time identity anchor that binds their wallet to the agreement."

## [1:05 to 1:40] Run a confidential payroll

On screen: the payroll run, then the success state.

> "Now payroll. Each amount becomes a commitment. A Groth16 proof is generated
> and verified inside a Stellar smart contract, proving the amount is within the
> agreed range, without printing it. The settlement posts on-chain over USDC."

On-screen callout while the run progresses: "settle, prove, verify".

## [1:40 to 2:15] The proof is real and on-chain (your strongest 30 seconds)

On screen: switch to the pre-opened stellar.expert tab.
1. Show the `verify_and_record` transaction on the PaymentVerifier contract.
2. Point to the recorded proof: `verified: true`, the recipient hash, the
   settlement tx hash, and the amount commitment. None reveal the salary.
3. Optionally show the terminal running the README "verify it yourself" command:
   `get_proof_record --proof_id 2` returning the same record.

> "This is not a mock. The proof was checked on-chain with Stellar's native
> pairing, then recorded. Anyone can re-verify it. The amount never appears."

## [2:15 to 2:40] Selective disclosure (auditor)

On screen:
1. As the company, mint a viewing-key auditor link.
2. Open it in the fresh profile, no wallet. The exact amounts appear.
3. Highlight that each amount re-derives the same commitment the contract
   checked, with a reconciled total. Export the CSV.
4. Back in the company topbar, click "Revoke disclosure" and reload the auditor
   link: it drops to read-only.

> "An auditor opens a link with no wallet and sees the exact amounts, each one
> re-verified against the on-chain commitment. And the company can revoke that
> access in one click."

## [2:40 to 3:00] Close

On screen: back to the dashboard.

> "ShieldPay. Confidential payroll on Stellar. Private by default, auditable on
> demand, verifiable by anyone. Built on Stellar and zero-knowledge proofs."

---

### Pre-flight checklist (do this before recording)

- [ ] Latest commits pushed and the Railway deploy is live.
- [ ] Test rows cleared from the production database (`scripts/cleanup_test_data.sql`).
- [ ] Contracts deployed to testnet, IDs in the env; `addresses.json` current.
- [ ] One real testnet run captured end to end, with a real stellar.expert link.
- [ ] Optional, for the USDC rail on screen: run `pnpm setup:usdc` so the
      treasury holds USDC and the settlement shows the USDC asset, not the XLM
      marker.
- [ ] stellar.expert pre-opened on the PaymentVerifier contract to avoid dead air.

### One-line value proposition (for the submission text)

Confidential payroll on Stellar: pay contributors, prove on-chain each amount was
correct, keep the figure private, and disclose it only to an authorized auditor.
