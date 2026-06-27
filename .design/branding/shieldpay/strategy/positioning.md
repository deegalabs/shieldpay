# Positioning

> Phase: strategy | Brand: ShieldPay | Generated: 2026-06-27

---

## The sharpened positioning statement

For finance teams at DAOs and Web3-native companies who must pay contributors in
stablecoins without publishing every salary on a public ledger, **ShieldPay** is
the **confidential payroll** platform that keeps each amount private while proving
on-chain that it was paid correctly, and discloses the exact figure only to an
auditor the company authorizes, **because** every payment is settled on Stellar
and backed by a zero-knowledge proof verified inside a smart contract, not by
ShieldPay's word.

One sentence: **ShieldPay is private payroll you can prove.**

## The category we are creating

**Provable privacy** in payroll. The market forces a false choice:

- **Public-ledger payroll** (Superfluid, Sablier, Request, DAO payment flows):
  every contributor's pay is legible to anyone with the wallet address. Privacy: 0.
- **Trust-me payroll** (Deel, QuickBooks Payroll, traditional rails): the books
  are private, but the only proof a payment was correct is the vendor's database
  and your faith in it. Provability: an invoice, not a guarantee.

ShieldPay refuses the trade. The amount is masked by default, the correctness is
proven by math, and the figure is disclosed only on the company's terms. No
competitor sells "private AND independently provable" as one promise. That seam
is the category.

## The differentiator (the one thing competitors cannot copy on a slide)

**The masked → verified → disclosed sequence**, made real end to end:

1. **Masked** — the salary never appears in clear text on-chain. A watcher sees
   that the company paid a contributor, not how much.
2. **Verified** — a proof confirms the amount fell inside the agreed range and
   matches the commitment, checked by a contract anyone can call. Trust does not
   route through ShieldPay.
3. **Disclosed** — the company hands a viewing key to a named auditor, who sees
   the exact figure for a fixed window. Privacy is the default; disclosure is a
   deliberate, scoped, revocable act.

Deel can mask. A block explorer can verify a transfer. Neither can do all three
as one settlement-grade motion. That is the moat.

## 2×2 positioning map

Axes: **Privacy of amounts** (public ledger ↔ private by default) and
**Provability** (trust the vendor ↔ verifiable by anyone).

```
              VERIFIABLE BY ANYONE
                       |
   Superfluid ·        |        ★ ShieldPay
   Sablier   ·         |        (private + provable)
   Request   ·         |
                       |
 PUBLIC LEDGER ────────┼──────── PRIVATE BY DEFAULT
                       |
                       |   · Deel
   (block explorers)   |   · QuickBooks Payroll
        ·              |   · Mercury / Ramp (off-chain)
                       |
              TRUST THE VENDOR
```

- **Top-left** (public + verifiable): on-chain payroll tools. Provable, but every
  salary is exposed. The privacy-anxious CFO will not ship payroll here.
- **Bottom-right** (private + trust-me): Deel, QuickBooks, neobank rails. Familiar
  and discreet, but "proof" is a PDF and a database.
- **Top-right, owned by ShieldPay alone:** private by default *and* verifiable by
  anyone. Empty until now. This is the white space the discover and audit phases
  both named, expressed as a market position rather than a visual one.

## Proof points (the reasons to believe)

- **Proven on-chain, not asserted.** Each payroll run produces a Groth16 proof
  verified inside a Soroban contract; the verified record is queryable on Stellar
  by anyone, including a court or a tax authority, without ShieldPay in the loop.
- **Disclosure is scoped and revocable.** The auditor portal is read-only,
  time-boxed, and limited to the selected period. It cannot move funds, see the
  company balance, or read other companies' books.
- **Settlement is fast and final.** Stellar confirms in seconds, at fractions of
  a cent, in native USDC, so privacy does not cost the CFO speed or fees.
- **The salary is never stored or sent in clear text.** Only the commitment and
  the agreed range are recorded. There is no plaintext amount to leak, subpoena,
  or scrape.
- **Cryptography stays invisible.** No CFO, contributor, or auditor reads the word
  "zero-knowledge" to use the product. They read "private," "verified," and
  "disclosed." The proof works underneath.

## Quality check

Swap "Deel" or "Superfluid" into the statement above and it breaks: Deel cannot
say "verified on-chain by anyone," and Superfluid cannot say "private by default,
disclosed only to an authorized auditor." The position is specific to ShieldPay
and to all three personas (CFO privacy, auditor disclosure, contributor proof).

---

## Related
- [archetype.md](./archetype.md)
- [brand-platform.md](./brand-platform.md)
- [messaging.md](./messaging.md)
- [INDEX.md](./INDEX.md)
