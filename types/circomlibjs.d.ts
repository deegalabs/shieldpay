// Minimal ambient types for circomlibjs (used by the proof scripts and the
// income-credential signer/prover). Only the surface we actually call is typed.
declare module 'circomlibjs' {
  export interface PoseidonField {
    toString(x: unknown): string;
    e(x: unknown): unknown;
  }
  export interface Poseidon {
    (inputs: Array<number | string | bigint>): unknown;
    F: PoseidonField;
  }
  export function buildPoseidon(): Promise<Poseidon>;

  /** An EdDSA-Poseidon signature: R8 point plus the S scalar. */
  export interface EddsaSignature {
    R8: [unknown, unknown];
    S: bigint;
  }
  export interface Eddsa {
    F: PoseidonField;
    /** Derive the BabyJubJub public key [Ax, Ay] from a 32-byte private key. */
    prv2pub(prv: Uint8Array): [unknown, unknown];
    signPoseidon(prv: Uint8Array, msg: unknown): EddsaSignature;
    verifyPoseidon(msg: unknown, sig: EddsaSignature, pub: [unknown, unknown]): boolean;
  }
  export function buildEddsa(): Promise<Eddsa>;
}
