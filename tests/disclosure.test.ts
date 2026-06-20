import { describe, it, expect } from 'vitest';
import { newViewingKey, sealWitness, openWitness } from '@/lib/zk/disclosure';
import { poseidonCommitment, randomFieldElement } from '@/lib/zk/commitment';
import { disclosePayments, summarizeDisclosure } from '@/lib/payments/disclose';
import type { PaymentRow } from '@/lib/db/client';

/**
 * The privacy core. A sealed witness opens only with the right viewing key, and
 * a disclosed amount must re-derive the same commitment the chain verified.
 */
describe('selective disclosure sealing', () => {
  it('round-trips a witness under the viewing key', () => {
    const vk = newViewingKey();
    const w = { amountCents: 50000, randomness: '123456789' };
    const opened = openWitness(vk, sealWitness(vk, w));
    expect(opened).toEqual(w);
  });

  it('returns null for the wrong viewing key', () => {
    const blob = sealWitness(newViewingKey(), { amountCents: 50000, randomness: '7' });
    expect(openWitness(newViewingKey(), blob)).toBeNull();
  });

  it('returns null for a tampered blob', () => {
    const vk = newViewingKey();
    const blob = sealWitness(vk, { amountCents: 50000, randomness: '7' });
    const tampered = blob.slice(0, -2) + (blob.endsWith('AA') ? 'BB' : 'AA');
    expect(openWitness(vk, tampered)).toBeNull();
  });
});

function payment(over: Partial<PaymentRow>): PaymentRow {
  return { id: '1', value_commitment: '', disclosure: null, ...over } as unknown as PaymentRow;
}

describe('disclosePayments re-verifies against the commitment', () => {
  it('matches on-chain when the witness opens to the committed value', async () => {
    const vk = newViewingKey();
    const amountCents = 50000;
    const randomness = randomFieldElement();
    const commitment = await poseidonCommitment(amountCents, randomness);
    const p = payment({
      id: '1',
      value_commitment: commitment,
      disclosure: sealWitness(vk, { amountCents, randomness }),
    });

    const map = await disclosePayments(vk, [p]);
    const d = map.get('1')!;
    expect(d.amountCents).toBe(amountCents);
    expect(d.matchesOnChain).toBe(true);

    const summary = summarizeDisclosure(map);
    expect(summary.disclosedTotalCents).toBe(amountCents);
    expect(summary.disclosedCount).toBe(1);
    expect(summary.allMatch).toBe(true);
  });

  it('flags a mismatch when the commitment does not match the witness', async () => {
    const vk = newViewingKey();
    const amountCents = 50000;
    const randomness = randomFieldElement();
    const wrongCommitment = await poseidonCommitment(99999, randomness);
    const p = payment({
      id: '2',
      value_commitment: wrongCommitment,
      disclosure: sealWitness(vk, { amountCents, randomness }),
    });

    const d = (await disclosePayments(vk, [p])).get('2')!;
    expect(d.amountCents).toBe(amountCents);
    expect(d.matchesOnChain).toBe(false);
  });

  it('does not disclose a payment without a sealed witness', async () => {
    const d = (await disclosePayments(newViewingKey(), [payment({ id: '3', disclosure: null })])).get('3')!;
    expect(d.amountCents).toBeNull();
    expect(d.matchesOnChain).toBe(false);
  });
});
