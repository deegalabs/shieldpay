// Minimal ambient types for circomlibjs (used by the proof scripts).
declare module 'circomlibjs' {
  export interface PoseidonField {
    toString(x: unknown): string;
  }
  export interface Poseidon {
    (inputs: Array<number | string | bigint>): unknown;
    F: PoseidonField;
  }
  export function buildPoseidon(): Promise<Poseidon>;
}
