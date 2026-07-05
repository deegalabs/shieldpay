/**
 * Client-side identity anchor. Builds and submits the AnchorRegistry self-anchor
 * transaction, signed by the collaborator's own Privy embedded wallet (the
 * worker is the tx source). The anchor metadata binds their ID hash to their
 * Stellar address for a specific company. Shared by the invite acceptance flow
 * and the worker portal "complete anchor" action.
 *
 * M2: `anchor_with_range` now require_auth's BOTH the worker and the company. The
 * company is custodial in the demo, so its Soroban authorization entry is
 * co-signed server-side (POST /api/worker/anchor/company-auth), which returns the
 * fully assembled transaction. The worker adds their own envelope signature here
 * and submits. When the endpoint is unavailable, the contract still predates M2,
 * or no `contractorId` is known (the invite flow, before a worker session), this
 * falls back to the single-party self-anchor so nothing regresses.
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
  // The worker-cosigned payment range (USDC cents). When provided, the worker
  // co-signs the range on-chain (anchor_with_range) so the PaymentVerifier can
  // enforce that every payment to them proves within exactly this range.
  rangeMinCents?: number;
  rangeMaxCents?: number;
  // When known (worker portal), the contract id used to request the company's
  // co-signature. Absent in the invite flow (no worker session yet).
  contractorId?: string;
}): Promise<string> {
  const {
    addr,
    companyAddress,
    anchorContractId,
    cpfHash,
    signRawHash,
    rangeMinCents,
    rangeMaxCents,
    contractorId,
  } = args;
  const sdk: any = await import('@stellar/stellar-sdk');
  const { rpc, Contract, TransactionBuilder, Networks, Address, nativeToScVal, Keypair, xdr } = sdk;
  const server = new rpc.Server('https://soroban-testnet.stellar.org');

  // Best-effort fund so a brand-new wallet can pay the tx fee on testnet. Do this
  // first so the co-signing endpoint (which reads the worker account) succeeds.
  await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(addr)}`).catch(() => {});

  const withRange = rangeMinCents != null && rangeMaxCents != null && rangeMaxCents > 0;

  // Attach the worker's envelope signature to an already-built transaction and
  // submit it, waiting for confirmation.
  async function signAndSubmit(tx: any): Promise<string> {
    const hashHex = ('0x' + tx.hash().toString('hex')) as `0x${string}`;
    const { signature } = await signRawHash({ address: addr, chainType: 'stellar', hash: hashHex });
    const sigBuf = Buffer.from(signature.replace(/^0x/, ''), 'hex');
    tx.signatures.push(
      new xdr.DecoratedSignature({ hint: Keypair.fromPublicKey(addr).signatureHint(), signature: sigBuf }),
    );
    const sent = await server.sendTransaction(tx);
    if (sent.status === 'ERROR') throw new Error(`anchor send failed: ${JSON.stringify(sent.errorResult)}`);
    let got = await server.getTransaction(sent.hash);
    for (let i = 0; got.status === 'NOT_FOUND' && i < 25; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      got = await server.getTransaction(sent.hash);
    }
    if (got.status !== 'SUCCESS') throw new Error(`anchor not confirmed (${got.status})`);
    return sent.hash;
  }

  // Preferred path: ask the server to co-sign the company's authorization entry
  // and return the assembled transaction. The worker only adds their signature.
  if (withRange && contractorId) {
    try {
      const res = await fetch('/api/worker/anchor/company-auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contractorId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.cosigned && typeof data.xdr === 'string') {
          const tx = TransactionBuilder.fromXDR(data.xdr, Networks.TESTNET);
          return await signAndSubmit(tx);
        }
      }
    } catch {
      /* fall through to the single-party self-anchor below */
    }
  }

  // Fallback: single-party self-anchor with the plain `anchor` (worker-only
  // require_auth). We reach here only when the company co-signature was NOT
  // obtained, e.g. a non-custodial company whose treasury is its own wallet, so
  // the server holds no key for it. `anchor_with_range` require_auth's the
  // company too and would fail on-chain without that signature, so we anchor the
  // identity alone; the payment range is still enforced off-chain and inside the
  // per-payment proof. On-chain range binding only happens on the co-signed path.
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
  return await signAndSubmit(tx);
}
