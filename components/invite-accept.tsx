'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Collaborator-side invite acceptance — N2.
 * Collect identity (legal/tax ID + name + declaration) → Privy embedded Stellar
 * wallet → accept (store wallet + cpf_hash, activate) → on-chain self-anchor
 * (AnchorRegistry.anchor, signed by the collaborator's own wallet as tx source;
 * the anchor metadata binds their ID hash to the address) → record anchored.
 */
export function InviteAccept({
  token,
  companyAddress,
  anchorContractId,
  defaultName,
}: {
  token: string;
  companyAddress: string;
  anchorContractId: string;
  defaultName: string;
}) {
  const { ready, authenticated, login, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();

  const [name, setName] = useState(defaultName);
  const [cpf, setCpf] = useState('');
  const [declared, setDeclared] = useState(false);
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

  async function anchorOnChain(addr: string, cpfHash: string): Promise<string> {
    const sdk: any = await import('@stellar/stellar-sdk');
    const { rpc, Contract, TransactionBuilder, Networks, Address, nativeToScVal, Keypair, xdr } = sdk;
    const server = new rpc.Server('https://soroban-testnet.stellar.org');

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

  async function run() {
    if (name.trim().length < 2 || cpf.trim().length < 3 || !declared) {
      setError('Fill in your name and ID, and accept the declaration.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setStep('Setting up your wallet…');
      const addr = await getStellarWallet();

      setStep('Confirming your details…');
      const acc = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, stellar_address: addr, cpf, name }),
      });
      const accData = await acc.json();
      if (!acc.ok) throw new Error(accData.error?.formErrors?.join(', ') || accData.error || 'accept failed');

      setStep('Anchoring your identity on-chain (approve in your wallet)…');
      const txHash = await anchorOnChain(addr, accData.cpf_hash);

      setStep('Finishing…');
      await fetch('/api/invite/anchored', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, tx_hash: txHash }),
      });
      setDone(true);
    } catch (e: any) {
      const msg = String(e?.message || e);
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
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Your full name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="cpf">Your legal/tax ID (CPF)</Label>
        <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
        <p className="mt-1 text-xs text-muted">Stored only as a hash, never in plaintext.</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-[hsl(var(--brand))]"
          checked={declared}
          onChange={(e) => setDeclared(e.target.checked)}
        />
        <span className="text-muted">
          I declare that the wallet created for me and the ID above are mine, and I authorize
          receiving payments at this address.
        </span>
      </label>

      {!authenticated ? (
        <Button className="w-full" size="lg" disabled={!ready} onClick={login}>
          Sign in to continue
        </Button>
      ) : (
        <Button className="w-full" size="lg" disabled={busy} onClick={run}>
          {busy ? step || 'Working…' : 'Accept & anchor my identity'}
        </Button>
      )}
      <p className="text-center text-xs text-muted">
        A secure Stellar wallet is created for you, no seed phrase. You keep full control; the
        organization never holds your keys.
      </p>
      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
