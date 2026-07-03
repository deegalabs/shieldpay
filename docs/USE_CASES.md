# Use cases by persona

ShieldPay has three personas. Each one has a distinct entry point, a distinct
set of permissions, and never sees more than its role allows. This document
describes how each persona reaches the platform and what they do once inside.

The cryptography stays invisible to all three. Terms like zero-knowledge proof,
Soroban, or BN254 never appear in the interface. They surface only inside the
payment receipt, where a court or an accountant needs the proof trail.

## Persona 1: Company (finance / operations)

The company pays contractors and is the only persona that can move funds.

### How they access

1. Open `/signup` and choose the Company role.
2. Sign in with email, Google, or a passkey. Privy creates a Stellar wallet for
   the company; there is no seed phrase to store. The Privy session is exchanged
   for a role-scoped ShieldPay session at `/api/auth/privy`.
3. First sign-in lands on `/onboarding` to set the legal name, tax id, and
   confirm the company wallet. After that, sign-in goes straight to `/dashboard`.

### What they do

- **Dashboard (`/dashboard`)**: operating balance, total paid this period, active
  contractors, and the latest payments with their verification status.
- **Contractors (`/contractors`)**: add a contractor (`/contractors/new`), set the
  contractual range (minimum and maximum monthly amount), and generate an invite
  link (`/api/contractors/[id]/invite-link`). A contractor must be anchored before
  they can be paid.
- **Payroll (`/payroll`)**: upload a CSV or fill the run manually, validate each
  line (anchored address, sufficient USDC, amount inside the contractual range),
  preview the total, then confirm. The system settles the USDC payment, generates
  the proof, and records it on-chain. Progress is shown as settle, prove, verify.
- **Receipts (`/receipts`)**: every confirmed payment has a downloadable receipt.
  The receipt states the payment is verified on-chain and carries a QR code that
  re-verifies it on the public Stellar explorer, without trusting ShieldPay.
- **Settings (`/settings`)**: generate a temporary, read-only auditor link with a
  chosen expiry (`/api/auth/auditor-link`).

### What they never do

The company cannot read a contractor's exact amount from chain data alone. The
amount is hidden behind a commitment and revealed only with the viewing key.

## Persona 2: Contractor (worker)

The contractor receives payments and proves they were paid, without exposing the
exact figure publicly.

### How they access

1. The company sends an invite link. The contractor opens `/invite/[token]`.
2. They sign in with email, Google, or a passkey. Privy creates their Stellar
   wallet. They accept the invite (`/api/invite/accept`).
3. They run a one-time identity anchor: a 0 XLM self-signed transaction whose
   memo binds their wallet to the contract. This is the link a court needs
   between the on-chain address and the legal identity. After anchoring, the
   company sees the contractor as ready to be paid.
4. Later sign-ins go to `/payments`.

### What they do

- **Payments (`/payments`)**: the history of received payments, each marked as
  verified, with a receipt to view or download.
- **Download for tax filing**: export all receipts to attach to a tax return.

### What they never do

The contractor sees only their own payments. They cannot see the company balance,
other contractors, or move any funds.

## Persona 3: Auditor (accountant / inspector)

The auditor reviews a period of payments with read-only access and no crypto
wallet.

### How they access

1. The company generates a temporary link from Settings. The auditor opens
   `/audit/[token]`. No sign-in and no wallet are required.
2. The link is scoped to one company and one period, and expires on the date the
   company chose (for example 30, 60, or 90 days).

### What they do

- **Audit view (`/audit/[token]`)**: a summary of the period (total paid, number
  of contractors, number of payments) and a table of transactions with their
  Stellar hashes and verified status.
- **Export (`/api/audit/export`)**: a fiscal report as CSV or PDF.

### What they never do

The auditor cannot see the current company balance, payments outside the granted
period, any other company, or perform any financial operation. The portal is
read-only by construction.

## Cross-persona use case: Proof-of-Payroll

Beyond the per-payment proofs, a payroll run can produce a single aggregate proof,
Proof-of-Payroll. One Groth16 proof shows that the individual amounts in the run
sum to a public total and that each amount sits within its agreed range, without
revealing any individual salary. It is verified on-chain in a dedicated Soroban
verifier instance.

This lets a company prove the shape of its payroll to an outside party without
opening the book line by line:

- **To a DAO or its members**: show that the treasury paid a stated total for the
  period and that every contributor was paid within their agreed band, without
  publishing who earns what.
- **To an investor**: demonstrate that reported payroll spend matches what was
  actually settled on-chain, a proof-of-reserves style attestation for payroll.
- **To a regulator or auditor**: attest total compensation and range compliance
  for a period while keeping individual salaries confidential.

Honest limitation: the on-chain check now binds each non-padding line to a
recorded per-payment proof of the same company with a matching range, so a company
cannot aggregate with invented lines or ranges. The remaining limit is that the
worker-cosigned range protects the honest flow, not a company crafting raw contract
calls; binding the real on-chain recipient to the anchored identity is roadmap. The
exact individual amounts remain disclosable only to a holder of the viewing key.

## Cross-persona use case: Proof of income

Proof-of-Payroll faces the company outward. Proof of income faces the worker
outward, reusing the same on-chain machinery. A worker proves to a third party
that they received income within a claimed range, attested by their employer,
verifiable on-chain by anyone, without revealing any single monthly amount.

- **To a bank or a landlord**: show a provable income band for a loan or a lease,
  without handing over pay stubs or the exact figure.
- **To a consulate (visa) or an immigration officer**: attest employment income in
  a range, verifiable independently on-chain, for a visa or residency application.
- **Cross-border**: the same credential serves a lender or an authority in another
  country, since anyone can verify it from the public verifier page.

The company issues the credential over the worker's recent recorded payments (an
employer key signs each month, the circuit proves the sum is in range and emits a
per-verifier nullifier so it is replay-safe). A public, wallet-free page verifies
it straight from the Soroban income verifier. Honest limitation: the credential
proves that an employer key signed the records, but binding that key to a named
company on-chain (an employer registry) is roadmap.

## Access control summary

| Capability                    | Company | Contractor | Auditor |
| ----------------------------- | :-----: | :--------: | :-----: |
| Move funds / run payroll      |   yes   |     no     |   no    |
| See own payment history       |   yes   |    yes     |   no    |
| See all contractors           |   yes   |     no     |   no    |
| See current company balance   |   yes   |     no     |   no    |
| Read a period of payments     |   yes   |     no     | period  |
| Export fiscal report          |   yes   |     no     |   yes   |
| Reveal exact amount           |   key   |     key    |   no    |
| Wallet required               |   yes   |    yes     |   no    |

"key" means the value is shown only to a holder of the viewing key, never from
public chain data alone.
