import { Keypair, type xdr } from '@stellar/stellar-sdk';
import { invokeAndConfirm } from './soroban';

/**
 * Abstracts WHO signs a company's on-chain action, so the platform can run
 * non-custodially. The rest of the payment flow does not care how the signature
 * is produced, only that the company authorizes its own call.
 */
export interface CompanySigner {
  /** The company account that is the transaction source and authorizes the call. */
  readonly address: string;
  /** Sign and submit a Soroban contract invocation; returns hash + return value. */
  invoke(operation: xdr.Operation): Promise<{ hash: string; returnValue: unknown }>;
}

/**
 * Server-side signer: holds the company secret and signs on the server. This is
 * the current path. The non-custodial path is a browser signer (the company's
 * own wallet signs client-side) that implements this same interface, so callers
 * never change. The goal is to remove the server-held company key entirely.
 */
export class ServerSigner implements CompanySigner {
  private readonly kp: Keypair;

  constructor(secret: string) {
    this.kp = Keypair.fromSecret(secret);
  }

  get address(): string {
    return this.kp.publicKey();
  }

  invoke(operation: xdr.Operation) {
    return invokeAndConfirm(this.kp, operation);
  }
}
