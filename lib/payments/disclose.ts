/**
 * Auditor-side selective disclosure (N4).
 *
 * Given a viewing key, open each payment's sealed witness and re-derive the
 * Poseidon commitment to prove the revealed amount is exactly what was
 * committed on-chain. This is what makes the disclosure trustworthy: the
 * auditor does not take the company's word for the figure — they recompute the
 * same commitment the Stellar contract verified.
 */
import { openWitness } from '@/lib/zk/disclosure';
import { readOnChainCommitment } from '@/lib/stellar/soroban';
import type { PaymentRow } from '@/lib/db/client';

export interface Disclosed {
  amountCents: number | null; // null if not disclosable / wrong key
  matchesOnChain: boolean; // recomputed commitment == the commitment the contract holds
  verifiedAgainst: 'chain' | 'db'; // 'chain' = live contract read; 'db' = RPC-down fallback
}

/** Map payment id → disclosed amount + on-chain match. */
export async function disclosePayments(
  viewingKey: string,
  payments: PaymentRow[],
): Promise<Map<string, Disclosed>> {
  const out = new Map<string, Disclosed>();
  // Build Poseidon once and reuse across all rows (buildPoseidon is expensive).
  const { buildPoseidon } = await import('circomlibjs');
  const poseidon = await buildPoseidon();
  const commit = (amountCents: number, randomness: string) =>
    poseidon.F.toString(poseidon([amountCents, randomness]));

  for (const p of payments) {
    if (!p.disclosure) {
      out.set(p.id, { amountCents: null, matchesOnChain: false, verifiedAgainst: 'db' });
      continue;
    }
    const w = openWitness(viewingKey, p.disclosure);
    if (!w) {
      out.set(p.id, { amountCents: null, matchesOnChain: false, verifiedAgainst: 'db' });
      continue;
    }
    const recomputed = commit(w.amountCents, w.randomness);
    // Prefer the live on-chain commitment (what the contract verified). Fall back
    // to the stored column only if the RPC is unavailable, and say which was used.
    const onChain = await readOnChainCommitment(p.proof_id);
    out.set(p.id, {
      amountCents: w.amountCents,
      matchesOnChain: onChain !== null ? recomputed === onChain : recomputed === p.value_commitment,
      verifiedAgainst: onChain !== null ? 'chain' : 'db',
    });
  }
  return out;
}

export interface DisclosureSummary {
  disclosedTotalCents: number;
  disclosedCount: number;
  allMatch: boolean;
  verifiedLive: boolean; // true iff every disclosed row was checked against a live chain read
}

export function summarizeDisclosure(map: Map<string, Disclosed>): DisclosureSummary {
  let disclosedTotalCents = 0;
  let disclosedCount = 0;
  let allMatch = true;
  let verifiedLive = true;
  for (const d of map.values()) {
    if (d.amountCents !== null) {
      disclosedTotalCents += d.amountCents;
      disclosedCount += 1;
      if (!d.matchesOnChain) allMatch = false;
      if (d.verifiedAgainst !== 'chain') verifiedLive = false;
    }
  }
  return { disclosedTotalCents, disclosedCount, allMatch, verifiedLive };
}
