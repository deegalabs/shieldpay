// Minimal ambient types for snarkjs (the package ships no declarations).
declare module 'snarkjs' {
  export const groth16: {
    fullProve(
      input: object,
      wasmPath: string,
      zkeyPath: string,
    ): Promise<{ proof: unknown; publicSignals: string[] }>;
    prove(
      zkeyPath: string,
      witness: string,
    ): Promise<{ proof: unknown; publicSignals: string[] }>;
    verify(
      verificationKey: object,
      publicSignals: string[],
      proof: unknown,
    ): Promise<boolean>;
  };
  export const zKey: Record<string, unknown>;
  export const powersOfTau: Record<string, unknown>;
}
