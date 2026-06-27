import type { xdr, Memo } from '@stellar/stellar-sdk';
import type { CompanySigner } from './signer';

/**
 * Client-side CompanySigner: the company signs its own on-chain actions with its
 * own wallet (Privy), so the server never holds the company key. It implements
 * the same interface as ServerSigner, so the payment flow does not change, only
 * which signer is supplied. This is the non-custodial signer.
 *
 * The signing mirrors the worker anchor: build (and, for Soroban, prepare) the
 * transaction, sign its hash with the wallet via signRawHash, attach the
 * decorated signature, submit. Testnet endpoints, like the rest of the client
 * code; parameterize for mainnet later.
 */
type SignRawHash = (args: {
  address: string;
  chainType: 'stellar';
  hash: `0x${string}`;
}) => Promise<{ signature: string }>;

export class BrowserSigner implements CompanySigner {
  readonly address: string;
  private readonly signRawHash: SignRawHash;

  constructor(address: string, signRawHash: SignRawHash) {
    this.address = address;
    this.signRawHash = signRawHash;
  }

  /** Sign a built transaction's hash with the company wallet and attach it. */
  private async attachSignature(sdk: any, tx: any): Promise<void> {
    const { Keypair, xdr } = sdk;
    const hashHex = ('0x' + tx.hash().toString('hex')) as `0x${string}`;
    const { signature } = await this.signRawHash({
      address: this.address,
      chainType: 'stellar',
      hash: hashHex,
    });
    const sigBuf = Buffer.from(signature.replace(/^0x/, ''), 'hex');
    tx.signatures.push(
      new xdr.DecoratedSignature({
        hint: Keypair.fromPublicKey(this.address).signatureHint(),
        signature: sigBuf,
      }),
    );
  }

  async invoke(operation: xdr.Operation): Promise<{ hash: string; returnValue: unknown }> {
    const sdk: any = await import('@stellar/stellar-sdk');
    const { rpc, TransactionBuilder, Networks, scValToNative } = sdk;
    const server = new rpc.Server('https://soroban-testnet.stellar.org');

    const account = await server.getAccount(this.address);
    let tx = new TransactionBuilder(account, { fee: '1000000', networkPassphrase: Networks.TESTNET })
      .addOperation(operation)
      .setTimeout(60)
      .build();
    tx = await server.prepareTransaction(tx);
    await this.attachSignature(sdk, tx);

    const sent = await server.sendTransaction(tx);
    if (sent.status === 'ERROR') {
      throw new Error(`sendTransaction failed: ${JSON.stringify(sent.errorResult)}`);
    }
    let got = await server.getTransaction(sent.hash);
    for (let i = 0; got.status === 'NOT_FOUND' && i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      got = await server.getTransaction(sent.hash);
    }
    if (got.status !== 'SUCCESS') throw new Error(`transaction ${sent.hash} status: ${got.status}`);
    return { hash: sent.hash, returnValue: got.returnValue ? scValToNative(got.returnValue) : null };
  }

  async submitClassic(ops: xdr.Operation[], memo?: Memo): Promise<{ hash: string }> {
    const sdk: any = await import('@stellar/stellar-sdk');
    const { Horizon, TransactionBuilder, BASE_FEE, Networks } = sdk;
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');

    const account = await server.loadAccount(this.address);
    let builder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    }).setTimeout(180);
    for (const op of ops) builder = builder.addOperation(op);
    if (memo) builder = builder.addMemo(memo);
    const tx = builder.build();
    await this.attachSignature(sdk, tx);

    const res = await server.submitTransaction(tx);
    return { hash: res.hash };
  }
}
