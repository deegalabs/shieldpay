import { Keypair, TransactionBuilder, BASE_FEE, type xdr, type Memo } from '@stellar/stellar-sdk';
import { invokeAndConfirm } from './soroban';
import { loadAccount, horizonServer, networkPassphrase } from './client';

/**
 * Abstracts WHO signs a company's on-chain actions, so the platform can run
 * non-custodially. The rest of the payment flow does not care how the signature
 * is produced, only that the company authorizes its own calls (the Soroban
 * proof record and the classic settlement).
 */
export interface CompanySigner {
  /** The company account that is the transaction source and authorizes the call. */
  readonly address: string;
  /** Sign and submit a Soroban contract invocation; returns hash + return value. */
  invoke(operation: xdr.Operation): Promise<{ hash: string; returnValue: unknown }>;
  /** Build a classic transaction from these ops (sourced and sequenced from
   * `address`), sign, submit, and return the confirmed hash. */
  submitClassic(ops: xdr.Operation[], memo?: Memo): Promise<{ hash: string }>;
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

  async submitClassic(ops: xdr.Operation[], memo?: Memo): Promise<{ hash: string }> {
    const account = await loadAccount(this.kp.publicKey());
    let builder = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase }).setTimeout(180);
    for (const op of ops) builder = builder.addOperation(op);
    if (memo) builder = builder.addMemo(memo);
    const tx = builder.build();
    tx.sign(this.kp);
    const res = await horizonServer.submitTransaction(tx);
    return { hash: res.hash };
  }
}
