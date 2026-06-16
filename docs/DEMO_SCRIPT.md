# ShieldPay — Demo Video Script (2–3 min)

Goal: clearly show the product working and explain **what ZK is doing**, per the
hackathon submission requirements. You do not need to appear on camera.

## [0:00–0:20] The hook
> "Your company paid the contractor. They claim they never received it. How do
> you prove it in court?"

## [0:20–0:45] Why blockchain
Briefly: blockchain is immutable, timestamps are irrefutable, and — the key
point — **zero-knowledge proofs let anyone verify a payment was correct without
revealing the private amount.**

## [0:45–1:30] The flow (hero)
1. Sign in (email / Google / passkey via Privy, or one-click **demo**) — no seed
   phrase, no extension.
2. Onboarding: create the company (name + tax id) → land on the dashboard.
3. **Contractors** → the contractor's agreed range is set (e.g. $450–$550).
4. **Pay & Prove** → pick the contractor, confirm.
5. Progress stepper: commit → **prove** → **verify on-chain** → record.
6. Success card: "Payment proven — Verified on-chain", with an explorer link.

> On-screen callout while the stepper is on "prove / verify":
> "A Groth16 zero-knowledge proof is generated and verified inside a Stellar
> smart contract — proving the amount is within the agreed range without
> revealing it."

## [1:30–2:00] The legal proof
1. Click **Legal Defense** for João Silva.
2. PDF opens with the full trail.
3. Show the QR → opens stellar.expert → "Verified on-chain".
4. "This is what you show the judge."

## [2:00–2:20] Worker portal
1. João logs in with his wallet.
2. Sees May/2026 received ✅.
3. Downloads the receipt for his tax return.

## [2:20–2:40] Auditor portal
1. Company generates a temporary read-only link.
2. Accountant sees the quarter's table of verified payments.
3. Exports CSV/PDF.

## [2:40–3:00] Close
> "ShieldPay: crypto payments with real legal protection. Built on Stellar +
> zero-knowledge proofs."

---

### Recording checklist
- [ ] Seed demo data (`npm run seed`)
- [ ] Contracts deployed to testnet; IDs in `.env`
- [ ] ZK artifacts built (`npm run zk:setup`)
- [ ] One real testnet payment captured end-to-end
- [ ] Show a real `stellar.expert` link, not a mock
