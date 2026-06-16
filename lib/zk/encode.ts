/**
 * Encode snarkjs Groth16 (BN254) artifacts into the byte layout the Soroban
 * PaymentVerifier expects (uncompressed big-endian; G2 in c1-before-c0 order).
 *
 * TypeScript port of circuits/scripts/encode_bn254_for_soroban.mjs, used at
 * runtime by the payment flow. Keep the two in sync.
 */
import type { Groth16Proof } from './types';

/** Require a defined value (snarkjs arrays are well-formed; guards keep TS happy). */
function req<T>(v: T | undefined, what: string): T {
  if (v === undefined) throw new Error(`malformed artifact: missing ${what}`);
  return v;
}

function fieldToBe32(value: string | bigint): Buffer {
  const n = typeof value === 'bigint' ? value : BigInt(value);
  if (n < 0n || n >= 1n << 256n) throw new Error(`field element out of range: ${n}`);
  return Buffer.from(n.toString(16).padStart(64, '0'), 'hex');
}

function u32be(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function encodeG1(p: string[]): Buffer {
  if (p.length >= 3) {
    const z = BigInt(req(p[2], 'G1.z'));
    if (z === 0n) return Buffer.alloc(64);
    if (z !== 1n) throw new Error(`unsupported G1 z: ${z}`);
  }
  return Buffer.concat([fieldToBe32(req(p[0], 'G1.x')), fieldToBe32(req(p[1], 'G1.y'))]);
}

// snarkjs stores each Fp2 as [c0, c1]; Soroban expects c1 || c0.
function encodeFp2(v: string[]): Buffer {
  return Buffer.concat([fieldToBe32(req(v[1], 'Fp2.c1')), fieldToBe32(req(v[0], 'Fp2.c0'))]);
}

function encodeG2(p: string[][]): Buffer {
  if (p.length >= 3) {
    const z = req(p[2], 'G2.z');
    const z0 = BigInt(req(z[0], 'G2.z.c0'));
    const z1 = BigInt(req(z[1], 'G2.z.c1'));
    if (z0 === 0n && z1 === 0n) return Buffer.alloc(128);
    if (z0 !== 1n || z1 !== 0n) throw new Error('unsupported G2 z');
  }
  return Buffer.concat([encodeFp2(req(p[0], 'G2.x')), encodeFp2(req(p[1], 'G2.y'))]);
}

/** Encode a snarkjs proof (pi_a G1, pi_b G2, pi_c G1) to 256 bytes. */
export function encodeProof(proof: Groth16Proof): Buffer {
  return Buffer.concat([
    encodeG1(proof.pi_a),
    encodeG2(proof.pi_b),
    encodeG1(proof.pi_c),
  ]);
}

/** Encode public signals (decimal strings) to u32(len) || 32B each. */
export function encodePublicSignals(signals: string[]): Buffer {
  return Buffer.concat([u32be(signals.length), ...signals.map((s) => fieldToBe32(s))]);
}

/** A single field element (e.g. the value commitment) as 32 big-endian bytes. */
export { fieldToBe32 };
