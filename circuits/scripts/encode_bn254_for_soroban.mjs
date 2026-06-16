#!/usr/bin/env node
/*
 * Encode snarkjs Groth16 (BN254) artifacts into the byte layout the Soroban
 * PaymentVerifier expects.
 *
 * Usage:
 *   node encode_bn254_for_soroban.mjs <vk|proof|public> <input.json>   # prints hex
 *
 * Layout (uncompressed, big-endian — matches CAP-0074 / soroban-sdk bn254):
 *   G1 (64B):  be(X) || be(Y)
 *   G2 (128B): be(X_c1) || be(X_c0) || be(Y_c1) || be(Y_c0)   <- c1 BEFORE c0
 *   vk:   alpha(G1) beta(G2) gamma(G2) delta(G2) u32(ic_len) IC[](G1)
 *   proof:  pi_a(G1) pi_b(G2) pi_c(G1)
 *   public: u32(len) signals[](32B each)
 *
 * The single biggest gotcha: snarkjs stores each Fp2 as [c0, c1] but Soroban
 * expects c1 || c0. This encoder swaps it. Adapted from jamesbachini/Noir-Groth16.
 */
import fs from 'node:fs';

function fail(m) { console.error(m); process.exit(1); }

function toBigInt(v) {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return BigInt(v);
  if (typeof v === 'string') return BigInt(v.trim());
  fail(`unsupported field element type: ${typeof v}`);
}

function u32be(value) {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(value, 0);
  return out;
}

function fieldToBe32(value) {
  const n = toBigInt(value);
  if (n < 0n || n >= 1n << 256n) fail(`field element out of range: ${n}`);
  return Buffer.from(n.toString(16).padStart(64, '0'), 'hex');
}

function encodeG1(point, label) {
  if (!Array.isArray(point) || point.length < 2) fail(`${label} malformed`);
  if (point.length >= 3) {
    const z = toBigInt(point[2]);
    if (z === 0n) return Buffer.alloc(64, 0);
    if (z !== 1n) fail(`${label} unsupported z ${z}`);
  }
  return Buffer.concat([fieldToBe32(point[0]), fieldToBe32(point[1])]);
}

// snarkjs Fp2 = [c0, c1]; Soroban expects c1 || c0.
function encodeFp2(v, label) {
  if (!Array.isArray(v) || v.length < 2) fail(`${label} malformed`);
  return Buffer.concat([fieldToBe32(v[1]), fieldToBe32(v[0])]);
}

function encodeG2(point, label) {
  if (!Array.isArray(point) || point.length < 2) fail(`${label} malformed`);
  if (point.length >= 3) {
    const z = point[2];
    if (toBigInt(z[0]) === 0n && toBigInt(z[1]) === 0n) return Buffer.alloc(128, 0);
    if (toBigInt(z[0]) !== 1n || toBigInt(z[1]) !== 0n) fail(`${label} unsupported z`);
  }
  return Buffer.concat([encodeFp2(point[0], `${label}.x`), encodeFp2(point[1], `${label}.y`)]);
}

function encodeVk(vk) {
  const ic = vk.IC;
  return Buffer.concat([
    encodeG1(vk.vk_alpha_1, 'vk_alpha_1'),
    encodeG2(vk.vk_beta_2, 'vk_beta_2'),
    encodeG2(vk.vk_gamma_2, 'vk_gamma_2'),
    encodeG2(vk.vk_delta_2, 'vk_delta_2'),
    u32be(ic.length),
    ...ic.map((p, i) => encodeG1(p, `IC[${i}]`)),
  ]);
}

function encodeProof(p) {
  return Buffer.concat([
    encodeG1(p.pi_a, 'pi_a'),
    encodeG2(p.pi_b, 'pi_b'),
    encodeG1(p.pi_c, 'pi_c'),
  ]);
}

function encodePublic(signals) {
  return Buffer.concat([u32be(signals.length), ...signals.map((v) => fieldToBe32(v))]);
}

const mode = process.argv[2];
const inputPath = process.argv[3];
if (!mode || !inputPath) fail('usage: encode_bn254_for_soroban.mjs <vk|proof|public> <input.json>');

const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
let out;
if (mode === 'vk') out = encodeVk(parsed);
else if (mode === 'proof') out = encodeProof(parsed);
else if (mode === 'public') out = encodePublic(parsed);
else fail(`unknown mode: ${mode}`);

process.stdout.write(out.toString('hex'));
