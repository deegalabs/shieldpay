/**
 * Selective disclosure — the "viewing key" (N4).
 *
 * The chain and the public auditor view only ever see the Poseidon commitment
 * and the contractual range, never the exact amount. A company holds a
 * *viewing key*; with it (and only with it) an authorized auditor can both
 * reveal the exact amount AND re-derive the commitment to confirm it matches
 * what was committed on-chain. Disclosure that is verifiable — not "trust the
 * spreadsheet".
 *
 * The sealed blob stores the circuit witness {amountCents, randomness}; opening
 * it lets the auditor recompute Poseidon(amount, randomness) and check equality
 * against the on-chain commitment (see lib/payments/disclose.ts).
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const INFO = 'shieldpay-disclosure-v1';

/** A fresh 32-byte viewing key (hex) for a company. */
export function newViewingKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Derive the symmetric encryption key from the viewing key (domain-separated).
 * The intermediate keying material (the raw viewing-key bytes) is zeroed as soon
 * as the derived key exists, so it does not linger in a heap buffer. The caller
 * is responsible for zeroing the returned key once it is done with it.
 */
function aesKey(viewingKeyHex: string): Buffer {
  const ikm = Buffer.from(viewingKeyHex, 'hex');
  try {
    return Buffer.from(hkdfSync('sha256', ikm, Buffer.alloc(0), INFO, 32));
  } finally {
    ikm.fill(0);
  }
}

export interface Witness {
  amountCents: number;
  randomness: string;
}

/** Seal {amountCents, randomness} under the viewing key → base64 (iv|tag|ct). */
export function sealWitness(viewingKeyHex: string, w: Witness): string {
  const key = aesKey(viewingKeyHex);
  try {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALG, key, iv);
    const pt = Buffer.from(JSON.stringify(w), 'utf8');
    const ct = Buffer.concat([cipher.update(pt), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ct]).toString('base64');
  } finally {
    key.fill(0); // best-effort: do not leave the derived key in a heap buffer
  }
}

/**
 * Open a sealed witness with the viewing key (null if key/blob mismatch or
 * tampered). The AES key derived from the viewing key is best-effort zeroed in a
 * finally, so the key material used to reveal the amount does not linger in
 * memory after the witness is opened.
 */
export function openWitness(viewingKeyHex: string, blob: string): Witness | null {
  let key: Buffer | null = null;
  try {
    const buf = Buffer.from(blob, 'base64');
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ct = buf.subarray(IV_LEN + TAG_LEN);
    key = aesKey(viewingKeyHex);
    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    const w = JSON.parse(pt.toString('utf8')) as Witness;
    if (typeof w.amountCents !== 'number' || typeof w.randomness !== 'string') return null;
    return w;
  } catch {
    return null;
  } finally {
    key?.fill(0); // best-effort: zero the derived key once the witness is open
  }
}
