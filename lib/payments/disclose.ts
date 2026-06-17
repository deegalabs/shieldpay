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
import type { PaymentRow } from '@/lib/db/client';

export interface Disclosed {
  amountCents: number | null; // null if not disclosable / wrong key
  matchesOnChain: boolean; // recomputed commitment == stored (on-chain) commitment
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
      out.set(p.id, { amountCents: null, matchesOnChain: false });
      continue;
    }
    const w = openWitness(viewingKey, p.disclosure);
    if (!w) {
      out.set(p.id, { amountCents: null, matchesOnChain: false });
      continue;
    }
    out.set(p.id, {
      amountCents: w.amountCents,
      matchesOnChain: commit(w.amountCents, w.randomness) === p.value_commitment,
    });
  }
  return out;
}

export interface DisclosureSummary {
  disclosedTotalCents: number;
  disclosedCount: number;
  allMatch: boolean;
}

export function summarizeDisclosure(map: Map<string, Disclosed>): DisclosureSummary {
  let disclosedTotalCents = 0;
  let disclosedCount = 0;
  let allMatch = true;
  for (const d of map.values()) {
    if (d.amountCents !== null) {
      disclosedTotalCents += d.amountCents;
      disclosedCount += 1;
      if (!d.matchesOnChain) allMatch = false;
    }
  }
  return { disclosedTotalCents, disclosedCount, allMatch };
}
