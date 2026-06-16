import { Keypair } from '@stellar/stellar-sdk';
import { randomBytes, createHash } from 'node:crypto';

/**
 * Stellar Wallet Auth — passwordless login by signing a challenge with the
 * wallet key that controls the funds. No passwords are ever stored.
 *
 * Flow:
 *   1. server issues a challenge string
 *   2. user signs it with their wallet (Freighter in the browser)
 *   3. server verifies the signature against the claimed public key
 *   4. server issues a short-lived session token
 */

export interface Challenge {
  message: string;
  issuedAt: number;
  nonce: string;
}

/** Create a one-time challenge for a given public key. */
export function createChallenge(publicKey: string): Challenge {
  const nonce = randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  const message = `shieldpay_auth|${publicKey}|${issuedAt}|${nonce}`;
  return { message, issuedAt, nonce };
}

/**
 * Verify a signature produced by the wallet over the challenge message.
 * `signatureBase64` is the base64-encoded raw signature bytes.
 */
export function verifySignature(
  publicKey: string,
  message: string,
  signatureBase64: string,
): boolean {
  try {
    const kp = Keypair.fromPublicKey(publicKey);
    const sig = Buffer.from(signatureBase64, 'base64');
    return kp.verify(Buffer.from(message, 'utf8'), sig);
  } catch {
    return false;
  }
}

/** SHA-256 hex helper used for cpf_hash and document hashes. */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Hash a CPF (Brazilian tax id) for on-chain anchoring.
 * Strips punctuation so the same CPF always hashes identically.
 */
export function hashCpf(cpf: string): string {
  return sha256Hex(cpf.replace(/\D/g, ''));
}
