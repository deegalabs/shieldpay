'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Collaborator-side invite acceptance — N2.
 * Privy login → embedded Stellar wallet → accept (set wallet, activate) →
 * on-chain self-anchor (AnchorRegistry.anchor, signed by the collaborator's own
 * Privy wallet as the tx source) → record anchored.
 */
export function InviteAccept({
  token,
  companyAddress,
  anchorContractId,
}: {
  token: string;
  companyAddress: string;
  anchorContractId: string;
}) {
  const { ready, authenticated, login, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();

  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getStellarWallet(): Promise<string> {
    const existing = (user?.linkedAccounts ?? []).find(
      (a: any) => a?.type === 'wallet' && a?.chainType === 'stellar' && a?.address,
    ) as any;
    if (existing?.address) return existing.address;
    const { wallet } = await createWallet({ chainType: 'stellar' });
    return wallet.address;
  }

  async function anchorOnChain(addr: string): Promise<string> {
    const sdk: any = await import('@stellar/stellar-sdk');
    const { rpc, Contract, TransactionBuilder, Networks, Address, nativeToScVal, Keypair, xdr } = sdk;
    const server = new rpc.Server('https://soroban-testnet.stellar.org');

    // Testnet: ensure the wallet has XLM for fees.
    await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(addr)}`).catch(() => {});
    const account = await server.getAccount(addr);

    const metadata = `SHIELDPAY|ANCHOR|v1|${companyAddress}`;
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

  async function run() {
    setBusy(true);
    setError(null);
    try {
      setStep('Setting up your wallet…');
      const addr = await getStellarWallet();

      setStep('Accepting the invite…');
      const acc = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, stellar_address: addr }),
      });
      const accData = await acc.json();
      if (!acc.ok && acc.status !== 409) throw new Error(accData.error || 'accept failed');

      setStep('Anchoring your identity on-chain (sign in your wallet)…');
      const txHash = await anchorOnChain(addr);

      setStep('Finishing…');
      await fetch('/api/invite/anchored', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, tx_hash: txHash }),
      });

      setDone(true);
    } catch (e: any) {
      const msg = String(e?.message || e);
      // Already anchored on a previous run still counts as success for the demo.
      if (/AlreadyAnchored|#1\b/.test(msg)) setDone(true);
      else setError(msg);
    } finally {
      setBusy(false);
      setStep(null);
    }
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
          <ShieldCheck size={18} />
        </span>
        <p className="text-lg font-semibold text-primary">Accepted &amp; anchored ✅</p>
        <p className="text-sm text-muted">
          Your wallet is linked and your identity is anchored on-chain. Sign in to your portal to
          see payments and download receipts.
        </p>
        <Button asChild className="w-full">
          <a href="/login">Go to my portal</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!authenticated ? (
        <Button className="w-full" size="lg" disabled={!ready} onClick={login}>
          Sign in to accept
        </Button>
      ) : (
        <Button className="w-full" size="lg" disabled={busy} onClick={run}>
          {busy ? step || 'Working…' : 'Accept & anchor my identity'}
        </Button>
      )}
      <p className="text-center text-xs text-muted">
        A secure Stellar wallet is created for you — no seed phrase. You keep full control; the
        organization never holds your keys.
      </p>
      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
