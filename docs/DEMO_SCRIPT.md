# ShieldPay: Demo Video Script (2 to 3 min)

Goal: show the product working and explain what the ZK proof is doing, per the
hackathon submission requirements. You do not need to appear on camera.

## [0:00 to 0:20] The hook

> "A DAO wants to pay its contributors on-chain, but salaries are private. On a
> transparent chain, the amount is public. How do you settle for real, keep the
> figure private, and still let an auditor check the numbers?"

## [0:20 to 0:45] Why ZK

Briefly: the blockchain is immutable and timestamps are irrefutable. The key
point is that a zero-knowledge proof lets anyone verify a payment was within the
agreed range without revealing the amount, and the company can disclose the exact
figure to an auditor on demand.

## [0:45 to 1:45] The flow

1. Sign in (email, Google, or passkey via Privy, or one-click demo). No seed
   phrase, no extension.
2. Set up the organization, then land on the dashboard.
3. Invite a contributor. Show the shareable invite link.
4. Accept the invite as the contributor: a Stellar wallet is created, identity is
   provided, and the on-chain self-anchor is signed.
5. Run a confidential payroll batch. Each amount is committed, proven, and
   recorded on-chain. The run shows the total.

> On-screen callout during the run:
> "A Groth16 zero-knowledge proof is generated and verified inside a Stellar
> smart contract, proving the amount is within the agreed range without revealing
> it."

## [1:45 to 2:15] Settlement and proof on-chain

1. Open the settlement transaction on stellar.expert.
2. Show the recipient-visible payment and the memo `SHIELDPAY|PAY|v1|...`.
3. Show the proof recorded in the `PaymentVerifier` contract.
4. "The payment is real and on-chain. The amount stays private."

## [2:15 to 2:40] Selective disclosure (auditor)

1. The company mints a viewing-key auditor link.
2. The auditor opens it with no wallet and sees the exact amounts.
3. Each amount is re-verified against the on-chain commitment, with a reconciled
   total. Export the CSV.

## [2:40 to 3:00] Close

> "ShieldPay: confidential payroll on Stellar. Private by default, auditable on
> demand. Built on Stellar and zero-knowledge proofs."

---

### Recording checklist

- [ ] Clean the test rows from the production database first
- [ ] Contracts deployed to testnet, IDs in the env
- [ ] ZK artifacts built (`npm run zk:setup`)
- [ ] One real testnet run captured end-to-end
- [ ] Show a real stellar.expert link, not a mock
