/**
 * Client-side identity anchor. Builds and submits the AnchorRegistry self-anchor
 * transaction, signed by the collaborator's own Privy embedded wallet (the
 * worker is the tx source). The anchor metadata binds their ID hash to their
 * Stellar address for a specific company. Shared by the invite acceptance flow
 * and the worker portal "complete anchor" action.
 */
type SignRawHash = (args: {
  address: string;
  chainType: 'stellar';
  hash: `0x${string}`;
}) => Promise<{ signature: string }>;

export async function anchorIdentity(args: {
  addr: string;
  companyAddress: string;
  anchorContractId: string;
  cpfHash: string;
  signRawHash: SignRawHash;
}): Promise<string> {
  const { addr, companyAddress, anchorContractId, cpfHash, signRawHash } = args;
  const sdk: any = await import('@stellar/stellar-sdk');
  const { rpc, Contract, TransactionBuilder, Networks, Address, nativeToScVal, Keypair, xdr } = sdk;
  const server = new rpc.Server('https://soroban-testnet.stellar.org');

  // Best-effort fund so a brand-new wallet can pay the tx fee on testnet.
  await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(addr)}`).catch(() => {});
  const account = await server.getAccount(addr);

  const metadata = `SHIELDPAY|ANCHOR|v1|org:${companyAddress}|cpf:${cpfHash}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metadata));
  const contractHash = Buffer.from(new Uint8Array(digest));

  const contract = new Contract(anchorContractId);
  const op = contract.call(
    'anchor',
    new Address(addr).toScVal(),
    new Address(companyAddress).toScVal(),
    nativeToScVal(contractHash, { type: 'bytes' }),
    nativeToScVal(metadata, { type: 'string' }),
  );

  let tx = new TransactionBuilder(account, { fee: '1000000', networkPassphrase: Networks.TESTNET })
    .addOperation(op)
    .setTimeout(120)
    .build();
  tx = await server.prepareTransaction(tx);

  const hashHex = ('0x' + tx.hash().toString('hex')) as `0x${string}`;
  const { signature } = await signRawHash({ address: addr, chainType: 'stellar', hash: hashHex });
  const sigBuf = Buffer.from(signature.replace(/^0x/, ''), 'hex');
  tx.signatures.push(
    new xdr.DecoratedSignature({ hint: Keypair.fromPublicKey(addr).signatureHint(), signature: sigBuf }),
  );

  const sent = await server.sendTransaction(tx);
  let got = await server.getTransaction(sent.hash);
  for (let i = 0; got.status === 'NOT_FOUND' && i < 25; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== 'SUCCESS') throw new Error(`anchor not confirmed (${got.status})`);
  return sent.hash;
}
