# Voice and Tone

> Phase: strategy | Brand: ShieldPay | Generated: 2026-06-27

---

ShieldPay's voice is **Calm, Precise, Trustworthy**: the quiet authority of a
steward who holds sensitive numbers, keeps exact books, and proves the payment
without ever raising its voice. It speaks to a skeptical CFO, a non-technical
contributor, and a rigorous auditor, and it never makes any of them read the word
"zero-knowledge."

## Voice attributes

| Attribute | Means | Doesn't mean | Do | Don't |
| --- | --- | --- | --- | --- |
| **Calm** | Steady, unhurried, never alarmed even in errors | Passive, vague, or detached | "The payment didn't go through. Nothing was sent." | "ERROR! Something went wrong!!" |
| **Precise** | Exact figures, named states, short sentences, one idea each | Dense jargon or false precision | "Verified on-chain at ledger 58,204,113." | "Successfully processed via our advanced infrastructure." |
| **Trustworthy** | Takes responsibility, says what is private and what is public, never oversells | Boastful, reassuring without proof | "Anyone can verify this payment. You decide who sees the amount." | "100% secure. Totally private. Trust us." |

## Tone spectrum (default position, 1–5)

```
Formal        1 ── 2 ──[3]── 4 ── 5  Casual          (professional, not stiff)
Serious       1 ──[2]── 3 ── 4 ── 5  Playful         (calm, never jokey)
Authoritative 1 ── 2 ──[3]── 4 ── 5  Friendly        (assured, approachable)
Technical     1 ── 2 ──[3]── 4 ── 5  Simple          (plain words, exact figures)
Reserved      1 ──[2]── 3 ── 4 ── 5  Enthusiastic    (quiet confidence)
```

## Tone shifts by surface and persona

| Surface / persona | Formal↔Casual | Serious↔Playful | Auth↔Friendly | Note |
| --- | :---: | :---: | :---: | --- |
| **Landing (CFO)** | 3 | 2 | 3 | Confident, restrained. Lead with the position, not hype. |
| **Company dashboard (CFO)** | 3 | 2 | 3 | Terse, exact. Numbers do the talking. |
| **Payroll run / stepper (CFO)** | 2 | 2 | 3 | State each step plainly: sending, proving, verifying, settled. |
| **Worker portal (contributor)** | 3 | 2 | 4 | Warmer, clearer. "You were paid. Here's the proof." No ZK. |
| **Receipt / proof record** | 2 | 1 | 2 | Most formal. Legal-grade exactness, plain language for a court. |
| **Auditor portal** | 2 | 1 | 3 | Precise, read-only posture made explicit. Legitimacy over warmth. |
| **Error message** | 2 | 2 | 4 | Calm, blame-free, says what happened and what to do next. |
| **Success / verified state** | 3 | 2 | 3 | Brief confirmation, then move on. Confidence, not celebration. |

## Do / Don't by attribute

**Calm**

| Do | Don't |
| --- | --- |
| "Payroll is being settled. This takes a few seconds." | "Hang tight!! Processing your transaction now..." |
| "The anchor isn't on-chain yet. The collaborator needs to finish it." | "Anchor failed! Action required immediately." |

**Precise**

| Do | Don't |
| --- | --- |
| "Paid $500.00 USDC. Verified on-chain. Proof ID 789." | "Payment sent successfully and securely." |
| "Disclosed to one auditor until July 15, 2026." | "Shared with your accountant for a while." |

**Trustworthy**

| Do | Don't |
| --- | --- |
| "The amount stays private. That it was paid is verifiable by anyone." | "Fully private and impossible to trace." |
| "This access is read-only. No funds can move from here." | "Don't worry, your auditor can't do anything bad." |

## Style rules

- **Contractions:** yes (didn't, can't, here's). Keeps the calm human, not stiff.
- **Sentence length:** short. Target ~12–15 words. One idea per sentence.
- **Figures:** always exact and formatted: `$500.00 USDC`, `ledger 58,204,113`,
  `Proof ID 789`. Never "around $500" or "a few hundred."
- **Em-dashes:** never. Use periods, commas, colons, or parentheses (per repo rule).
- **Exclamation marks:** never. Confidence does not shout.
- **Emoji:** never in product copy. The verified state is a designed badge, not a 🔒.
- **First person:** "we" for the brand, sparingly. Prefer the user's actions:
  "You paid," "You disclosed."
- **Addressing the user:** "you," or the name where known ("Hi, Jane").
- **Jargon:** avoid. Never surface "zero-knowledge," "Groth16," "Soroban,"
  "commitment," "BN254" in any of the three portals.

## The "no crypto jargon" lexicon

Cryptography is invisible. Translate every internal term into a plain word the CFO,
contributor, and auditor already use.

| Say this (user-facing) | Avoid this (internal only) |
| --- | --- |
| Verified on-chain | Groth16 proof verified / SNARK valid |
| Private / kept private | Masked commitment / hidden witness |
| Proof / proof of payment | zk-SNARK / zero-knowledge proof |
| Anchor your identity | Self-anchor transaction / memo binding |
| Settled | Transaction submitted to the ledger |
| Disclose to an auditor | Issue a viewing key |
| Wallet / your account | G-address / keypair / public key |
| Network | Soroban / Stellar protocol / BN254 |
| Within the agreed range | Range proof / min-max witness bounds |
| Record / receipt | ProofRecord / on-chain entry |
| Stablecoin payment | USDC SAC transfer |

The receipt and audit documents may name "Stellar" and "on-chain" once, plainly,
because a court or accountant needs the verifiable source. They still never read
"zero-knowledge."

## Example rewrites (in voice)

**Anchor failure** (current: `could not record the anchor` / API: "identity is not
anchored on-chain. The collaborator must finish their identity anchor before being
paid."):

> **Couldn't anchor this identity.** Nothing was sent. Jane needs to finish
> anchoring her identity before she can be paid. We've kept her ready in this run.

**Company create failure** (current: `could not save company`):

> **We couldn't save your company.** Nothing was charged or changed. Try again,
> and if it keeps happening, the network may be busy.

**Database unavailable** (current: `database unavailable`):

> **We can't reach your records right now.** No payment was made. Please try again
> in a moment.

**Amount outside range** (current: `Jane: amount outside range [450, 550]`):

> **Jane's amount is outside the agreed range.** You entered $600.00 USDC; the
> agreement allows $450.00 to $550.00. Adjust it to continue.

**Payroll success** (verified state):

> **3 payments settled and verified on-chain.** Receipts are ready. The amounts
> stay private; anyone can confirm the payments were correct.

**Auditor portal header** (read-only posture):

> **Read-only access to Acme DAO, Jan–Mar 2026.** Exact figures shown for this
> period only. Expires July 15, 2026. No funds can move from here.

---

## Related
- [archetype.md](./archetype.md)
- [brand-platform.md](./brand-platform.md)
- [messaging.md](./messaging.md)
- [INDEX.md](./INDEX.md)
