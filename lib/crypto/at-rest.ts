import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

/**
 * At-rest encryption for secrets stored in Postgres (the company viewing key).
 *
 * Backward compatible by design:
 *  - If VIEWING_KEY_ENC_KEY is not set, values are stored and read as plaintext
 *    (the current behavior), so nothing breaks before the key is configured.
 *  - If it is set, new values are encrypted (AES-256-GCM, key derived via HKDF)
 *    and tagged with a prefix; legacy plaintext rows still read correctly and are
 *    re-encrypted the next time they are written.
 */
const PREFIX = 'enc:v1:';
const IV_LEN = 12;
const TAG_LEN = 16;

function masterKey(): Buffer | null {
  const k = process.env.VIEWING_KEY_ENC_KEY;
  if (!k) return null;
  // Derive a 32-byte key from whatever secret is provided (any length).
  return Buffer.from(hkdfSync('sha256', Buffer.from(k), Buffer.alloc(0), 'shieldpay-at-rest-v1', 32));
}

/** Encrypt a value for storage. Returns plaintext unchanged if no master key is set. */
export function encryptAtRest(plaintext: string): string {
  const key = masterKey();
  if (!key) return plaintext;
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString('base64');
}

/** Decrypt a stored value. Legacy (unprefixed) values are returned as-is. */
export function decryptAtRest(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const key = masterKey();
  if (!key) throw new Error('VIEWING_KEY_ENC_KEY is required to read encrypted values');
  const buf = Buffer.from(stored.slice(PREFIX.length), 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
