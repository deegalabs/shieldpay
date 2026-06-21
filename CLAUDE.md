# CLAUDE.md: ShieldPay, Payroll and Payment Proof on Stellar + ZK

> Full context document for development with Claude Code and Cursor.
> Created: June 15, 2026.
> Hackathon: Stellar Hacks ZK. Deadline: June 29, 2026, 12:00 (Pacific time).

---

## 0. DEVELOPMENT RULES (READ EVERY TIME)

These rules apply to both developers and to any AI agent working in the
repository. They take priority over the rest of this document when there is a
conflict.

**Principle.** This is a hackathon entry, but it is a project that can become a
real product. Treat it as a real product from the start: code, security, data,
and documentation at production standard, with no shortcuts that cannot be
sustained later.

### 0.1 Language

- Everything inside the repository is in English: code, comments, identifiers,
  commit messages, documentation, sample data, and config.
- If we ever support multiple languages, it stays at the web app layer (UI copy
  through i18n). For now the whole repo is English only.

### 0.2 Code standards

Summary of what is already defined in the project. Match the style of the
surrounding code.

- **Runtime:** Node 22 (`.nvmrc`). **TypeScript** with `strict` and
  `noUncheckedIndexedAccess`. Path aliases `@/`, `@/lib`, `@/components`.
- **Package manager:** pnpm (see the `packageManager` field). Use `pnpm`, not npm.
- **Files:** `kebab-case` names (`company-form.tsx`, `nav-link.tsx`).
- **Components:** Server Component by default. `'use client'` only when needed,
  on the first line. UI primitives follow the shadcn pattern (`forwardRef`,
  `displayName`, variants in an `as const` object, classes via `cn()`).
- **Styling:** use semantic Tailwind tokens (`bg-surface`, `text-foreground`,
  `bg-brand`), never raw colors. Fintech palette (slate, emerald, amber, red,
  indigo). No neon green or hacker aesthetic. Cryptography is invisible in the
  end-user UI.
- **API routes:** always `export const runtime = 'nodejs'`. Validate every input
  with `zod` at the top of the file. Handler order: authentication, authorization
  by role or owner, logic, `try/catch`. Status codes: 400 validation, 401 no
  session, 403 wrong role, 404 not found, 422 business rule, 503 database down.
- **Database:** SQL is always parameterized, never concatenated. The exact amount
  of a payment is never stored in clear text, only the commitment and the range.
- **ZK and contracts:** the circuit runtime artifacts stay versioned. Rust
  contracts have tests in `src/test.rs` and pass `cargo test`.
- **Comments:** docstrings in `lib/` explain the why, not the what.

### 0.3 Commits

- Format `type(scope): description`. Types: `feat`, `fix`, `chore`, `docs`.
- Message is simple, in English, imperative, with the real feature detail.
- **No AI co-author.** Do not add a `Co-Authored-By` line for Claude or any other
  tool. Commits belong to the human developers.
- One commit per coherent change. Do not mix unrelated features.

### 0.4 Security audit

- Run the audit whenever possible, especially before publishing the repository,
  before each deploy, and when touching authentication, authorization, or fund
  movement.
- **Document the result in `SECURITY_AUDIT.md`** (root, git-ignored, internal).
  Each round records the date, what was tested, the findings by severity, and the
  status of each one. Open findings stay internal until they are fixed.
- `SECURITY.md` at root is the **public policy** (how to report, scope), with no
  detail of open issues. Responsible disclosure.
- Minimum checklist: secrets out of the code, input validated, SQL parameterized,
  routes protected by session and owner, errors that do not leak internals,
  dependencies with no critical vulnerability.

### 0.5 Writing documentation and text

- Write as a human for humans. Clear, objective, and coherent.
- **Nothing invented.** Only state what the code, the history, or the brief
  support. If something is partial or deferred, say so honestly.
- **Do not use em-dashes (the long dash).** Use periods, commas, colons, or
  parentheses.
- Avoid unnecessary jargon. Technical language appears only where it carries
  weight.

### 0.6 Verify before finishing

- Run `pnpm typecheck` and `pnpm build` and make sure they pass.
- For changes to contracts or the circuit, run `cargo test` and `pnpm zk:prove`.

> Positioning note. Sections 1 to 18 below were written for the original framing
> (Brazilian labor compliance and court-grade proof). The product was later
> repositioned to Web3-native confidential payroll (recipient visible, amount
> hidden, selective disclosure). The README and the project brief carry the
> current positioning. Keep that in mind when reading the background below.

---

## 1. PROJECT IDENTITY

### Name
**ShieldPay**, Payroll and Payment Proof on Stellar

### Tagline
> "Pay anyone in the world. Prove mathematically that you paid. Protect your company forever."

### What it is
ShieldPay is a web platform for verifiable payment and settlement built on
Stellar + Soroban + ZK Proofs. It lets companies, DAOs, and contractors pay
service providers and employees in native Stellar USDC, automatically generating
a mathematical on-chain proof (a ZK proof verifiable in Soroban) that works as an
irrefutable record of payment.

### What it is not
- It is not a full Brazilian CLT payroll system (CLT requires payment in Reais;
  this is in the process of changing through bill PL 2.324/2026, but it is not
  approved yet).
- It is not a private blockchain. Stellar is transparent by default. Privacy here
  is selective, through ZK range proofs.
- It is not equivalent to a Zcash shielded pool. We do not promise total
  transaction invisibility.

### Real use cases (where it works today, with no new law)
1. **Service providers, freelancers, contractor agreements (PJ):** with no CLT
   bond, payment in USDC is valid by contractual agreement.
2. **Web3-native companies** that already pay collaborators in crypto by mutual
   documented agreement.
3. **Cross-border payments:** a company abroad paying a person in Brazil or vice
   versa, where CLT does not apply.
4. **DAOs paying contributors:** with no CLT bond, with a need for proof of
   settlement.

---

## 2. LEGAL CONTEXT (CRITICAL, READ BEFORE CODING)

### Why this matters more than the technology

The product has a legal layer that makes it real, not just a technical demo. This
section is the result of research into Brazilian labor jurisprudence (TST), the
CLT, and labor doctrine.

### What Brazilian law requires as proof of payment (Art. 464 CLT)

The Superior Labor Court has consolidated two, and only two, valid forms of proof
for salary settlement:

**Path A:** A payslip **signed by the employee**, physically or digitally.

**Path B:** A **bank deposit receipt** into an account whose tax id belongs to
the contracted worker, with no extra signature required.

**Direct consequence:** A payslip without the employee's signature, unaccompanied
by an identified bank deposit, has **zero evidentiary value** at the TST. The
burden of proof is always on the employer.

### The Web3 problem with Path B

A blockchain has no tax id. A USDC payment from `GABCDE...` to `GXYZ123...` proves
to no judge that a specific person received a given amount. The link between legal
identity and on-chain address is missing.

### How ShieldPay solves it (the five documents of the legal defense)

So the company is protected in any dispute, the system generates and stores
automatically:

**Document 1, service agreement (off-chain)**
- Digitally signed (legal validity through the Brazilian Digital Civil Framework /
  ICP-Brasil or DocuSign).
- Contains: full name, tax id, company tax id, amount, frequency, service object.
- **Required field:** "The provider declares that the Stellar address `GABCDE...`
  is their exclusive property and authorizes receiving payments at this address."
- Legal reference: Art. 104 of the Civil Code (validity of digital contracts).

**Document 2, identity anchor transaction (on-chain Stellar)**
- The provider signs a 0 XLM transaction from their wallet to themselves.
- Required memo: `SHIELDPAY|ANCHOR|CPF:12345678900|CONTRACT:42|DATE:2026-06-01`.
- **Legal effect:** Cryptographic proof that the owner of that Stellar address
  declared they hold that tax id. Immutable, with a blockchain timestamp.
- This creates the address to identity link the judge needs.

**Document 3, payment transaction (on-chain Stellar)**
- Native USDC sent to the provider's address.
- Structured memo: `SHIELDPAY|PAY|CONTRACT:42|REF:MAY2026|USDC:500.00`.
- **Legal effect:** Equivalent to the bank deposit receipt (Path B of Art. 464
  CLT), as long as it is combined with Document 2 that binds the address to the
  tax id.

**Document 4, ZK proof of settlement (on-chain Soroban)**
- A verifiable mathematical proof that attests: "address X received an amount
  within the contractual range at block Y."
- Does not reveal the exact amount, only that it is within what was agreed (for
  example, between $400 and $600 USDC).
- Verifiable by any third party (judge, auditor, accountant) without trusting the
  company.
- Recorded in the Soroban contract as `verified: true` with the payment hash.

**Document 5, court receipt PDF (off-chain, generated by the system)**
- Generated automatically after each payment.
- Contains: contract data, anchor hash, payment hash, ZK proof result, QR code
  for instant verification, Stellar explorer link.
- Plain language for non-technical judges: "This document is a mathematical proof
  generated by the Stellar blockchain network that the amount was deposited into
  the recipient's address at block X. The verification code can be validated at
  [URL]."

### What a modern electronic payslip needs (2025 to 2026 jurisprudence)

Research into recent TST decisions and HR compliance doctrine confirmed that a
digital payslip has evidentiary force when it contains:
- Hash and timestamp of the document.
- Audit trail: who sent it, when it was made available, when it was accessed.
- Proof of awareness: traceable acceptance or confirmation of receipt.
- Deposit or transfer receipt that is linked.

ShieldPay automates all these elements through the blockchain.

### Legislative status of crypto salary payment in Brazil

- **PL 957/2025:** Proposes allowing up to 50% of salary to be paid in
  cryptocurrencies, with a written agreement between the parties. In progress in
  the Chamber.
- **PL 2.324/2026 (NOVO party):** Proposes amending the CLT to allow crypto
  salaries by contractual agreement. Filed in May 2026, in progress.
- **Crypto Legal Framework (Law 14.478/2022):** Recognizes virtual assets as a
  means of payment. In force since 2023.
- **Current situation:** Crypto CLT salary payment still has legal risk. For PJ /
  service providers, it is valid today by contractual agreement.

---

## 3. STELLAR TECHNICAL CONTEXT (REAL STATE IN JUNE 2026)

### Relevant protocols

**Protocol 25 "X-Ray" (mainnet: January 22, 2026)**
- Introduced native host functions for BN254 (the standard elliptic curve of ZK
  apps) and Poseidon/Poseidon2 (a hash optimized for ZK circuits).
- Enables efficient zk-SNARK verification in Soroban.
- Feature parity with Ethereum EIP-196 and EIP-197.

**Protocol 26 "Yardstick" (mainnet: May 6, 2026)**
- Added 9 new host functions: BN254 MSM, scalar field arithmetic (add, subtract,
  multiply, power, inverse), and curve membership checks for BLS12-381 and BN254.
- Moves heavy ZK arithmetic to the host layer, making Noir proof verification
  significantly cheaper.
- Lets the SAC (Stellar Asset Contract) create unlimited trustlines for
  G-accounts.

### ZK on Stellar: what is available and works

**Noir + UltraHonk on Soroban:**
- Repository: `indextree/ultrahonk_soroban_contract`.
- Status: Works on localnet with `--limits unlimited`. Optimization for testnet
  and mainnet is in progress (integration with the Protocol 26 BN254 precompiles
  will reduce cost significantly).
- **Real risk:** The UltraHonk verifier can still exceed the budget on testnet
  without the precompile optimizations. Monitor.

**Groth16 via Circom on Soroban (safer alternative):**
- Repository: `stellar/soroban-examples/groth16_verifier`.
- Status: Proven to work on testnet and mainnet.
- Cost: Lower than UltraHonk (smaller proofs).
- Tutorial: `jamesbachini.com/circom-on-stellar/`.
- **Recommendation:** For the hackathon, Groth16 is the safer path if UltraHonk
  presents budget problems.

**Noir + Groth16 backend (best of both worlds):**
- Repository: `jamesbachini.com/noir-groth16/`.
- Write circuits in Noir (more readable), generate Groth16 artifacts, verify in
  Soroban.
- End-to-end tutorial available.

### Stablecoins available on Stellar (mainnet, June 2026)
- **USDC** (Circle): native since 2021, highest volume.
- **EURC** (Circle): digital euro.
- **YLDS** (Figure): yield-bearing dollar.
- **MGUSD** (Bridge/MoneyGram): launched June 2, 2026.

**Recommendation for the project:** USDC. Highest liquidity, highest recognition,
SAC-level support in Soroban.

### Confirmed development resources

```
Stellar SDK JS:     @stellar/stellar-sdk
Soroban Rust SDK:   soroban-sdk
Noir:               nargo (ZK language)
Barretenberg:       bb (Noir proving backend)
Soroban verifier:   indextree/ultrahonk_soroban_contract
Groth16 verifier:   stellar/soroban-examples/groth16_verifier
Testnet explorer:   stellar.expert/explorer/testnet
Friendbot:          friendbot.stellar.org (testnet faucet)
Testnet RPC:        https://soroban-testnet.stellar.org
```

---

## 4. SYSTEM ARCHITECTURE

### Layer overview

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5, LEGAL DOCUMENT                                     │
│  PDF generated off-chain with a full proof trail            │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  LAYER 4, ZK PROOF (Soroban)                                │
│  Verifier contract records: "valid payment ✅"               │
│  Does not reveal the exact amount, range proof only          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  LAYER 3, PAYMENT (Stellar on-chain)                        │
│  USDC to the provider address                               │
│  Memo: SHIELDPAY|PAY|CONTRACT:X|REF:Y|USDC:Z                │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  LAYER 2, IDENTITY ANCHOR (Stellar on-chain)                │
│  Provider signs a 0 XLM tx with a tax id + contract memo    │
│  Binds address to legal identity                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  LAYER 1, CONTRACT (off-chain)                              │
│  Digital signature of the service agreement                 │
│  Stellar address declared by the provider                   │
└─────────────────────────────────────────────────────────────┘
```

### Full flow of a payment

```
1. PROVIDER ONBOARDING
   Company invites provider, provider fills in data (name, tax id, Stellar
   address), the system generates the contract PDF, both sign digitally,
   the provider runs the "anchor transaction" from their own wallet
   (self-signed), the system confirms the anchor on-chain.

2. PAYMENT TRIGGER
   CFO uploads a CSV [name, address, amount, reference],
   the system validates anchored addresses,
   the system generates a ZK proof off-chain for each payment,
   the system sends USDC + memo to each address,
   the system submits the ZK proof to Soroban for on-chain verification,
   Soroban records: verified=true, payment_hash, block_number.

3. RECEIPT GENERATION
   After on-chain confirmation (3 to 5 seconds on Stellar):
   the system generates a PDF automatically per payment,
   the PDF includes: contract data, anchor tx hash, payment tx hash,
   ZK proof result, verifier QR code, explorer URL,
   the PDF is available in the company panel and the provider portal.

4. PROVIDER PORTAL
   The provider signs in through Stellar Wallet Auth (signs a message with their
   wallet), sees the payment history, accesses the PDF of each payment, and can
   download all receipts for tax filing.

5. AUDITOR PORTAL
   The company generates a temporary link (expires in 30 days) for an
   auditor/accountant, the auditor sees the table of payments for the selected
   period, sees the verified ZK hashes and results, exports a fiscal report in
   PDF/CSV. The auditor does NOT see the company's current balance and has NO
   access to move funds.
```

### ZK Circuit: what it needs to prove

**Public inputs (visible on-chain):**
- Hash of the recipient address (not the address itself).
- Hash of the payment reference memo.
- Stellar block number.
- Commitment of the amount (not the amount).

**Private inputs (witness, never on-chain):**
- Real payment amount in USDC.
- Full recipient address.
- Contractual range key [min_value, max_value].

**What the circuit proves:**
1. `amount_paid >= contractual_minimum` (range proof lower bound).
2. `amount_paid <= contractual_maximum` (range proof upper bound).
3. `hash(recipient_address) == public_address_hash` (binding).
4. `hash(amount_paid) == amount_commitment` (commitment opening).

**Output:** `proof_valid: bool` recorded in Soroban.

**Technical note:** For the hackathon, the circuit can be simplified to just the
range proof. The address binding can be done off-chain in the MVP and evolve to
on-chain in production.

---

## 5. TECH STACK

### Frontend (Web Portals)
```
Framework:     Next.js 14+ (App Router)
Language:      TypeScript
Styling:       Tailwind CSS
Components:    shadcn/ui
Stellar SDK:   @stellar/stellar-sdk (for transactions and wallet auth)
PDF gen:       jsPDF or react-pdf
State:         Zustand
Forms:         react-hook-form + zod
```

### ZK Layer
```
Circuit language:    Noir (preferred) or Circom (safer fallback)
Proof backend:       Barretenberg (bb) for Noir
On-chain verifier:   Soroban contract (Rust)
Reference:           indextree/ultrahonk_soroban_contract (Noir/UltraHonk)
                     stellar/soroban-examples/groth16_verifier (Circom/Groth16)
Proof generation:    Off-chain (Node.js script or WASM in the browser)
```

### Soroban Contracts (Rust)
```
SDK:           soroban-sdk
Contracts:
  - PaymentVerifier: records and stores verified ZK proofs
  - AnchorRegistry: records identity anchors (address to contract)
Target:        wasm32v1-none
Deploy:        stellar contract deploy --network testnet
```

### Backend / Scripts
```
Runtime:       Node.js (TypeScript) or Rust scripts
Database:      PostgreSQL (off-chain metadata) or Supabase for a fast MVP
Auth:          Stellar Wallet Auth (sign message with the wallet private key)
CSV parsing:   papaparse
```

### Infrastructure
```
Frontend deploy:  Vercel
Stellar RPC:      Soroban RPC testnet to mainnet
PDF storage:      IPFS (hash in the contract) or S3 for the MVP
```

---

## 6. PROJECT FOLDER STRUCTURE

```
shieldpay/
├── CLAUDE.md                    <- this file
├── README.md                    <- public hackathon documentation
│
├── circuits/                    <- ZK circuits
│   ├── payment_proof/
│   │   ├── src/
│   │   │   └── main.nr          <- main Noir circuit
│   │   ├── Nargo.toml
│   │   └── target/              <- compiled artifacts (gitignore)
│   └── scripts/
│       ├── build_circuits.sh    <- compiles and generates the VK
│       └── generate_proof.ts    <- generates a proof for a payment
│
├── contracts/                   <- Soroban contracts (Rust)
│   ├── payment_verifier/
│   │   ├── src/
│   │   │   └── lib.rs           <- ZK proof verifier contract
│   │   └── Cargo.toml
│   ├── anchor_registry/
│   │   ├── src/
│   │   │   └── lib.rs           <- identity anchor contract
│   │   └── Cargo.toml
│   └── deploy/
│       ├── deploy.sh            <- testnet deploy script
│       └── addresses.json       <- deployed contract addresses
│
├── app/                         <- Next.js frontend
│   ├── (company)/               <- Company Portal (CFO/HR)
│   │   ├── dashboard/
│   │   ├── employees/           <- provider management
│   │   ├── payroll/             <- payment trigger
│   │   └── receipts/            <- history and receipts
│   ├── (worker)/                <- Provider Portal
│   │   ├── login/
│   │   ├── payments/
│   │   └── documents/
│   ├── (auditor)/               <- Auditor Portal
│   │   ├── [token]/             <- access through a temporary link
│   │   └── export/
│   └── api/
│       ├── anchor/              <- anchor endpoint
│       ├── pay/                 <- payment endpoint
│       ├── proof/               <- proof generation endpoint
│       └── verify/              <- verification endpoint
│
├── lib/
│   ├── stellar/
│   │   ├── client.ts            <- Stellar SDK client
│   │   ├── transactions.ts      <- transaction builders
│   │   ├── auth.ts              <- wallet authentication
│   │   └── usdc.ts              <- USDC helpers
│   ├── zk/
│   │   ├── prover.ts            <- off-chain proof generation
│   │   └── types.ts             <- TypeScript types for proofs
│   ├── pdf/
│   │   └── receipt.ts           <- receipt PDF generator
│   └── db/
│       └── schema.ts            <- database schema
│
├── scripts/
│   ├── setup.sh                 <- full environment setup
│   ├── test_flow.ts             <- full end-to-end flow test
│   └── seed.ts                  <- test data
│
└── docs/
    ├── ARCHITECTURE.md          <- detailed architecture diagram
    ├── LEGAL.md                 <- full legal context
    └── DEMO_SCRIPT.md           <- demo video script
```

---

## 7. THE THREE PORTALS: UX SPECIFICATION

### General design principle
**Golden rule:** Cryptography must be invisible. No technical term (ZK proof,
Soroban, BN254) appears in the end-user interface. These terms exist only in the
legal receipt documents where they are needed.

**Visual style:** Traditional Premium Fintech. References: Stripe Dashboard, Deel,
QuickBooks.

**Palette:**
- Background / panels: `#0F172A` (slate-900) and `#1E293B` (slate-800)
- Main text: `#F8FAFC` (slate-50)
- Primary action / success: `#10B981` (emerald-500)
- Warning: `#F59E0B` (amber-500)
- Error: `#EF4444` (red-500)
- Accent: `#6366F1` (indigo-500)

**Do NOT use:** Neon green, hacker/cyberpunk aesthetic, black backgrounds with
green text. That drives CFOs away.

---

### Portal 1, Company (CFO / HR)

**Authentication:** Stellar Wallet Auth. The company connects a corporate wallet
(Freighter, xBull) and signs a login message. No email/password.

**Screen: Dashboard**
```
┌─────────────────────────────────────────────────┐
│ ShieldPay              [Company XPTO] [Wallet]   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Operating Balance            Paid this month   │
│  ┌──────────────────┐         ┌───────────────┐ │
│  │  $ 12,450 USDC   │         │  $ 8,200 USDC │ │
│  └──────────────────┘         └───────────────┘ │
│                                                  │
│  Active providers: 12    Pending payments: 0    │
│                                                  │
│  [▶ Run Payroll]  [+ New Provider]              │
│                                                  │
│  Latest payments                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ Jane Doe     May/2026   $ 500 USDC   ✅  │   │
│  │ Alice Smith  May/2026   $ 750 USDC   ✅  │   │
│  │ ...                                       │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Screen: Run Payroll**
```
1. Upload CSV or manual entry
   CSV format: name, stellar_address, usdc_amount, reference

2. Automatic validation:
   ✅ Anchored address (identity linked)
   ✅ Enough USDC in the wallet
   ✅ Amount within the contractual range

3. Payroll preview with total
   "12 payments, Total: $ 8,200 USDC"

4. [Confirm and Pay] button
   Opens the wallet for signature,
   Progress bar: "Sending... Verifying... Recording proof...",
   Success screen: "12 payments confirmed ✅",
   "Receipts generated and available".
```

**Screen: Individual provider**
```
Jane Doe, tax id: 123.456.789-00
Stellar address: GABCDE... [verified ✅]
Contractual amount: $450 to $550 USDC/month

History:
┌────────────────────────────────────────────────┐
│ May/2026     $ 500 USDC    ✅ Verified         │
│              [📄 View Receipt] [⚖️ Legal Defense] │
│ April/2026   $ 500 USDC    ✅ Verified         │
│              [📄 View Receipt] [⚖️ Legal Defense] │
└────────────────────────────────────────────────┘
```

**"⚖️ Legal Defense" button:** generates in one click the full court-receipt PDF
with accessible language for a tribunal, containing all five chained proof
documents.

---

### Portal 2, Provider / Worker

**Authentication:** Stellar Wallet Auth. The provider connects the same wallet
whose address was anchored. The system automatically verifies they own the
address.

**Screen: My Payments**
```
Hello, Jane Doe

Last payment: $ 500 USDC, May/2026 ✅

Your payments:
┌─────────────────────────────────────────┐
│ May/2026   $ 500 USDC   ✅ Received     │
│            [📄 Receipt] [📥 Download]    │
│ Apr/2026   $ 500 USDC   ✅ Received     │
│            [📄 Receipt] [📥 Download]    │
└─────────────────────────────────────────┘

[📦 Download all for tax filing]
```

**Screen: Individual receipt**

Shows the "digital payslip" formatted with:
- Paying company + tax id
- Provider + tax id
- Payment reference (month/year, contract object)
- Status: "Payment verified mathematically ✅"
- QR code for public validation
- [Download PDF]

---

### Portal 3, Auditor / Accountant

**Access:** Temporary link generated by the company with a configurable expiry
(30/60/90 days). No crypto wallet needed.

**Screen: Auditor View**
```
Audit, Company XPTO Ltda
Period: January/2026 to March/2026
Generated on: 06/15/2026 | Expires on: 07/15/2026

Period summary:
Total paid: $ 24,600 USDC
Providers: 12
Payments: 36

Transaction table:
┌──────────────────────────────────────────────────────────┐
│ Date       Provider     Reference    Tx Hash    Status   │
│ 01/31      Jane D.      Jan/2026     abc123...  ✅ Verif │
│ 02/28      Jane D.      Feb/2026     def456...  ✅ Verif │
│ ...                                                       │
└──────────────────────────────────────────────────────────┘

[📊 Export Fiscal Report CSV] [📄 Export Full PDF]

⚠️ This access is read-only. No financial operation can be
performed through this portal.
```

**The auditor does NOT see:** the company's current balance, payments outside the
period, information from other companies.

---

## 8. SOROBAN CONTRACTS: SPECIFICATION

### Contract 1: `AnchorRegistry`

```rust
// Records the link between a Stellar address and contract metadata.
// The provider calls this contract when accepting onboarding.

pub struct AnchorRegistry;

#[contractimpl]
impl AnchorRegistry {
    // The provider registers their own address + a hash of the contract metadata.
    // Can only be called by the account itself (self-anchor).
    pub fn anchor(
        env: Env,
        worker_address: Address,    // provider address
        contract_hash: BytesN<32>,  // SHA256 hash of the contract PDF
        company_address: Address,   // hiring company address
        metadata: String,           // "CPF:123|CONTRACT:42|DATE:2026-06-01"
    ) -> Result<(), Error>

    // Checks whether an address is anchored for a specific company.
    pub fn is_anchored(
        env: Env,
        worker_address: Address,
        company_address: Address,
    ) -> bool

    // Returns the anchor metadata.
    pub fn get_anchor(
        env: Env,
        worker_address: Address,
        company_address: Address,
    ) -> Option<AnchorData>
}

pub struct AnchorData {
    contract_hash: BytesN<32>,
    metadata: String,
    anchored_at_ledger: u32,  // Stellar ledger of the anchor
    anchored_at_timestamp: u64,
}
```

### Contract 2: `PaymentVerifier`

```rust
// Records verified ZK proofs of payments.
// The company calls this contract after each payment.

pub struct PaymentVerifier;

#[contractimpl]
impl PaymentVerifier {
    // Initializes the contract with the ZK circuit verification key.
    pub fn initialize(env: Env, vk_bytes: Bytes) -> Result<(), Error>

    // Verifies and records a ZK proof of payment.
    // Returns: unique ID of the proof record.
    pub fn verify_and_record(
        env: Env,
        company_address: Address,        // paying company (must be caller)
        worker_address_hash: BytesN<32>, // hash of the provider address
        payment_tx_hash: BytesN<32>,     // hash of the Stellar payment tx
        value_commitment: BytesN<32>,    // Pedersen commitment of the amount
        proof: Bytes,                    // serialized ZK proof
        public_inputs: Vec<Val>,         // public inputs of the circuit
    ) -> Result<u64, Error>             // returns proof_id

    // Checks whether a specific payment has a recorded proof.
    pub fn is_verified(
        env: Env,
        payment_tx_hash: BytesN<32>,
    ) -> bool

    // Returns the full data of a proof.
    pub fn get_proof_record(
        env: Env,
        proof_id: u64,
    ) -> Option<ProofRecord>

    // Lists proofs for a company in a period.
    pub fn list_by_company(
        env: Env,
        company_address: Address,
        from_ledger: u32,
        to_ledger: u32,
    ) -> Vec<ProofRecord>
}

pub struct ProofRecord {
    proof_id: u64,
    company_address: Address,
    worker_address_hash: BytesN<32>,
    payment_tx_hash: BytesN<32>,
    value_commitment: BytesN<32>,
    verified: bool,               // always true if recorded
    verified_at_ledger: u32,
    verified_at_timestamp: u64,
}
```

---

## 9. ZK CIRCUIT: SPECIFICATION (NOIR)

```noir
// circuits/payment_proof/src/main.nr
// Circuit: proves that a payment is within the contractual range.

// Private inputs (witness, never revealed on-chain)
fn main(
    value: u64,                    // real payment amount in USDC cents
    value_randomness: Field,       // randomness for the Pedersen commitment
    worker_address_bytes: [u8; 32], // provider Stellar address
    address_randomness: Field,     // randomness for the address hash

    // Public inputs (visible on-chain)
    value_commitment: pub Field,   // Pedersen commitment of the amount
    worker_address_hash: pub Field, // hash of the provider address
    min_value: pub u64,            // contractual minimum
    max_value: pub u64,            // contractual maximum
    payment_tx_hash: pub Field,    // hash of the Stellar tx (binding)
) {
    // Constraint 1: range proof, amount within the contractual range
    assert(value >= min_value);
    assert(value <= max_value);

    // Constraint 2: commitment binding, amount matches the commitment
    let computed_commitment = pedersen_commitment(value as Field, value_randomness);
    assert(computed_commitment == value_commitment);

    // Constraint 3: address binding, address matches the public hash
    let computed_address_hash = poseidon2_hash(
        worker_address_bytes.map(|b| b as Field)
    );
    assert(computed_address_hash == worker_address_hash);
}
```

**Implementation note:** For the hackathon MVP, simplify to just the range proof
(Constraint 1) and verify the address binding off-chain in the backend. This
reduces circuit complexity and the risk of Soroban budget problems.

---

## 10. MEMO PROTOCOL: STANDARD FORMAT

### Anchor transaction (signed by the provider)
```
SHIELDPAY|ANCHOR|v1|{company_stellar_address}|{contract_id}|{cpf_hash}
```
Example:
```
SHIELDPAY|ANCHOR|v1|GCOMPANY...|42|a3f2b1...
```
- `cpf_hash`: SHA256 of the tax id without punctuation (partial privacy, does not
  expose the tax id but allows verification).
- Maximum 28 bytes in the Stellar memo field. Use memo_hash for long strings.

### Payment transaction (sent by the company)
```
SHIELDPAY|PAY|v1|{contract_id}|{reference}|{proof_id}
```
Example:
```
SHIELDPAY|PAY|v1|42|MAY2026|789
```
- `proof_id`: the ID returned by the PaymentVerifier contract after verifying the
  ZK proof.

---

## 11. MOCK DATA FOR DEVELOPMENT AND DEMO

### Example company
```
Name:           Acme DAO
Tax id:         12.345.678/0001-90
Stellar address: GCOMPANY... (generate in setup)
Mock balance:   15,000 USDC
```

### Example providers
```
Provider 1:
  Name:      Jane Doe
  Tax id:    123.456.789-00
  Address:   GWORKER1...
  Contract:  $450 to $550 USDC/month
  Status:    Anchored ✅

Provider 2:
  Name:      Alice Smith
  Tax id:    987.654.321-00
  Address:   GWORKER2...
  Contract:  $700 to $800 USDC/month
  Status:    Anchored ✅

Provider 3:
  Name:      Bob Johnson
  Tax id:    111.222.333-44
  Address:   GWORKER3...
  Contract:  $300 to $400 USDC/month
  Status:    Anchored ✅
```

### Example CSV for the demo
```csv
name,stellar_address,usdc_amount,reference
Jane Doe,GWORKER1...,500.00,MAY2026
Alice Smith,GWORKER2...,750.00,MAY2026
Bob Johnson,GWORKER3...,350.00,MAY2026
```

---

## 12. DEVELOPMENT ROADMAP (13 DAYS)

### Phase 1, ZK Foundation (Days 1 to 3)
**Goal:** Working circuit and verifier deployed to testnet.

- [ ] Set up environment: Nargo, bb, Rust, stellar-cli, Node.js.
- [ ] Write the Noir range proof circuit (simplified version for the MVP).
- [ ] Compile the circuit and generate the verification key (VK).
- [ ] Adapt `indextree/ultrahonk_soroban_contract` to the project VK.
- [ ] Deploy the verifier to Stellar testnet.
- [ ] End-to-end test: generate proof off-chain, submit, verify on-chain ✅.
- [ ] **Fallback:** If UltraHonk exceeds the budget, migrate to Groth16 via Circom.

### Phase 2, Business Contracts (Days 4 to 5)
**Goal:** AnchorRegistry and PaymentVerifier deployed and tested.

- [ ] Implement `AnchorRegistry` in Rust/Soroban.
- [ ] Implement `PaymentVerifier` in Rust/Soroban (wrapper of the ZK verifier).
- [ ] Unit tests for the contracts.
- [ ] Testnet deploy of both contracts.
- [ ] Test script: anchor, USDC payment, proof, record.

### Phase 3, Backend and Integrations (Days 6 to 7)
**Goal:** Functional API connecting the frontend to the contracts.

- [ ] `/api/anchor` endpoint, processes provider anchoring.
- [ ] `/api/pay` endpoint, orchestrates payment + proof + record.
- [ ] `/api/verify` endpoint, queries payment status.
- [ ] Off-chain proof generator (Node.js calling bb).
- [ ] Stellar SDK integration: building USDC transactions with a memo.
- [ ] Database schema + migrations (PostgreSQL or Supabase).

### Phase 4, Company Portal Frontend (Days 8 to 9)
**Goal:** Functional CFO portal for the demo.

- [ ] Base layout + design system (Tailwind + shadcn).
- [ ] Stellar Wallet Auth (Freighter).
- [ ] Dashboard with balance and history.
- [ ] CSV upload + validation + preview.
- [ ] Payment flow with progress feedback.
- [ ] Payment history with status.

### Phase 5, Provider and Auditor Portals + PDF (Days 10 to 11)
**Goal:** Secondary portals + legal receipt.

- [ ] Provider portal: login, history, download.
- [ ] Auditor portal: link access, table, export.
- [ ] PDF generator: full court receipt.
- [ ] PDF includes: all hashes, ZK result, QR code, language for judges.

### Phase 6, Demo and Delivery (Days 12 to 13)
**Goal:** Project ready for submission.

- [ ] Full end-to-end test of the flow: onboarding, payment, receipt, audit.
- [ ] Complete README.md with setup instructions.
- [ ] Record the demo video (2 to 3 minutes).
- [ ] Deploy frontend (Vercel).
- [ ] Submit on DoraHacks.

---

## 13. DEMO VIDEO SCRIPT (2 TO 3 MIN)

### Narrative structure

**[0:00 to 0:20] The problem (emotional hook)**
"Your company paid the provider. They claim they did not receive it. How do you
prove it in court?"

**[0:20 to 0:45] The context (why blockchain)**
Show briefly: the blockchain is immutable, timestamps are irrefutable, ZK proofs
are verifiable by anyone.

**[0:45 to 1:30] Flow demo (hero feature)**
1. The CFO uploads the CSV with 3 providers.
2. The system shows a preview with validations.
3. The CFO clicks "Confirm and Pay".
4. Progress bar: sending, proving, verifying.
5. Success screen: "3 payments verified ✅".

**[1:30 to 2:00] The legal proof**
1. Click "⚖️ Legal Defense" for Jane Doe.
2. The PDF opens with the full trail.
3. Show the QR code, the Stellar explorer link, "Verified on-chain".
4. "This is what you show the judge."

**[2:00 to 2:20] Provider portal**
1. Jane Doe accesses her portal.
2. Sees the May/2026 payment ✅.
3. Downloads the receipt for tax filing.

**[2:20 to 2:40] Auditor portal**
1. The company generates a temporary link for the accountant.
2. The accountant sees the quarter table.
3. Exports CSV/PDF for the tax authority.

**[2:40 to 3:00] Closing**
"ShieldPay: crypto payment with real legal protection. Built on Stellar + ZK
Proofs."

---

## 14. TECHNICAL DECISIONS AND DOCUMENTED TRADE-OFFS

### Decision 1: Noir vs Circom for the circuits

**Choice: Noir (primary) with Circom as a fallback**

Noir pros:
- Syntax close to Rust, the team has experience.
- More readable and maintainable circuit.
- UltraHonk backend available for Soroban (indextree).

Noir cons:
- Larger UltraHonk proofs, potentially more expensive.
- The Soroban verifier is still being optimized (may exceed the budget).

Circom fallback:
- Groth16 is proven to work on Stellar mainnet.
- Smaller and cheaper proofs.
- Steeper learning curve to write the circuit.

**Decision:** Start with Noir. On Day 2, run a budget test on testnet. If
`ExceededLimit`, migrate to Circom + Groth16 immediately.

### Decision 2: Privacy, range proof vs exact amount

**Choice: Range proof (amount within the contractual range)**

Rationale: The exact amount of each contract is visible on the blockchain even
with Stellar. The ZK proof does not hide the exact transaction amount, it proves
the amount is within the agreed range without revealing exactly how much.

**Honest limitation:** Anyone watching the blockchain sees that `GCOMPANY...` sent
USDC to `GWORKER...`. We do not see the exact amount through ZK, but the
transaction itself is public.

**What this means for the product:** Privacy here is range-based, not absolute.
The commercially sensitive value (for example, "Jane earns exactly $500/month")
is protected. The fact that the company paid Jane is not.

### Decision 3: Identity anchoring, on-chain vs off-chain

**Choice: On-chain through `AnchorRegistry`**

Rationale: The anchor needs to be immutable and verifiable independently of the
ShieldPay system. If the system goes down, the blockchain proof remains valid.

**Trade-off:** The tax id should not go in plain text on the blockchain. Use
`cpf_hash = SHA256(tax_id_without_punctuation)`. This allows verification (the
company can prove the hash matches the tax id by presenting it in court) without
exposing the tax id publicly.

### Decision 4: Off-chain database vs everything on-chain

**Choice: Hybrid, critical data on-chain, metadata off-chain**

On-chain (Soroban): verified ZK proofs, anchor records.
Off-chain (PostgreSQL): provider data, payment history, generated PDFs, auditor
links.

Rationale: On-chain storage cost on Stellar is real. Metadata that does not need
immutability stays off-chain. What needs to be verifiable and irrefutable stays
on-chain.

### Decision 5: Passwordless authentication

**Choice: Stellar Wallet Auth (sign message)**

Flow:
1. Backend generates a challenge: `shieldpay_auth_{timestamp}_{nonce}`.
2. User signs with their wallet (Freighter for the browser).
3. Backend verifies the signature with `stellar-sdk.Keypair.verify()`.
4. JWT issued with 24h validity.

Advantage: Zero password storage. The proof of identity is the same key that
controls the funds.

---

## 15. COMMON ERRORS AND HOW TO AVOID THEM

### Stellar-specific

**Memo field limit:** The Stellar memo field has a limit of 28 bytes (memo_text)
or 32 bytes (memo_hash). The defined memo protocol uses a hash when it exceeds
this.

**USDC trustlines:** Stellar accounts need to establish a trustline for USDC
before receiving it. Provider onboarding should check this and instruct about it.

**Soroban budget:** `--limits unlimited` only works on localnet. ALWAYS test on
testnet before assuming it works.

**Sequence numbers:** Stellar transactions have a sequence number. In batch
payments, build and sign all transactions before submitting, or use fee bump
transactions.

### ZK-specific

**Proof format mismatch:** Different versions of Nargo/bb generate proofs in
incompatible formats. Pin versions from the start: `nargo v1.0.0-beta.9` and
`bb v0.87.0`.

**Witness vs public inputs:** Confusing what is private and what is public
invalidates the privacy model. Always review the circuit before deploy.

**VK size:** Verification keys can be large. Store them in the contract in
`initialize()` and do not pass them in each `verify_proof()`.

### Legal-specific

**Do not confuse a PJ provider with CLT:** The product works today for PJ. For
CLT, it needs PL 2.324/2026 or similar to be approved. The README should make
this clear.

**The PDF does not replace the contract:** The receipt PDF proves the payment, but
the signed service agreement is what establishes the deal. Both are needed for
full protection.

---

## 16. ADDITIONAL CONTEXT: WHY STELLAR IS THE RIGHT BLOCKCHAIN HERE

### Real advantages of Stellar for this use case

**Native USDC:** Not USDC bridged from another chain. It is USDC issued directly
by Circle on Stellar. No bridge risk. Accepted globally.

**Finality in 3 to 5 seconds:** Labor payments are urgent. Stellar confirms in
seconds, not minutes or hours.

**Cost per transaction:** Fractions of a cent per operation. Batch payments to 100
providers cost less than $0.01 in total fees.

**Real payment infrastructure:** Stellar has MoneyGram (170+ countries, 470k
locations), Bitso (Latin America), Airtm. USDC can be cashed out to local currency
through the existing anchor network.

**ZK ready:** Protocol 25 and 26 delivered the necessary cryptographic primitives
at the host layer. We are not working around limitations, we are using features
designed for this.

### Fit with the hackathon

The hackathon briefing says explicitly: "projects that apply ZK to practical use
cases are a perfect match and especially welcome."

ShieldPay uses ZK to solve a problem that affects any company that pays anyone. It
is not an academic experiment. It is a product with a real market, with potential
production the day after the hackathon.

---

## 17. REFERENCES AND USEFUL LINKS

### Stellar
- ZK docs: https://developers.stellar.org/docs/build/apps/zk
- Protocol 25: https://stellar.org/blog/developers/announcing-stellar-x-ray-protocol-25
- Protocol 26: https://stellar.org/blog/foundation-news/stellar-yardstick-protocol-26-upgrade-guide
- Soroban docs: https://developers.stellar.org/docs/build/smart-contracts/overview
- Stellar SDK JS: https://stellar.github.io/js-stellar-sdk/

### ZK on Stellar
- UltraHonk Soroban: https://github.com/indextree/ultrahonk_soroban_contract
- Groth16 Verifier: https://github.com/stellar/soroban-examples/tree/main/groth16_verifier
- Tutorial Noir+Stellar: https://jamesbachini.com/noir-on-stellar/
- Tutorial Circom+Stellar: https://jamesbachini.com/circom-on-stellar/
- Tutorial Noir+Groth16: https://jamesbachini.com/noir-groth16/
- RISC Zero Stellar: https://github.com/NethermindEth/stellar-risc0-verifier/

### Noir
- Docs: https://noir-lang.org/docs/
- Nargo install: `curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash`

### Barretenberg
- Install: `curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash`

### Hackathon
- DoraHacks: https://dorahacks.io/hackathon/stellar-hacks-zk/detail
- Stellar Dev Discord: https://discord.gg/stellardev (channel #zk-chat)
- Telegram: https://t.me/+e898qibDUVExODkx

### Legal (references)
- Art. 464 CLT (proof of payment): guiatrabalhista.com.br
- Electronic payslip validity: factorialhr.com.br/blog/recibo-de-pagamento-de-salario/
- PL 2.324/2026 (crypto in salaries): livecoins.com.br

---

## 18. GLOSSARY

When asked to implement something, use these definitions:

| Term | Meaning in the project |
|---|---|
| Anchor | On-chain transaction that binds a Stellar address to contract data |
| Company | Hiring company (pays the providers) |
| Worker / Provider | Person or PJ entity that receives payment for the service |
| Auditor | Accountant or auditor with temporary read-only access |
| PaymentRecord | Record of a payment: tx hash + proof id + metadata |
| ZK Proof | Mathematical proof that the payment is within the contractual range |
| ProofRecord | On-chain record in the PaymentVerifier of a verified ZK proof |
| Court Receipt | PDF generated with a full proof trail for use in a tribunal |
| Contractual Range | [min_value, max_value] defined in the service agreement |
| Memo Protocol | Standard Stellar memo format for ShieldPay transactions |

---

*End of CLAUDE.md, ShieldPay v1.0*
*Last update: June 19, 2026 (translated to English, dev rules added in section 0)*
*Next action: address the open security findings in `SECURITY_AUDIT.md` (Phase 0).*
