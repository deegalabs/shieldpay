'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { anchorIdentity } from '@/lib/stellar/anchor-client';

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
  usdcCode,
  usdcIssuer,
  rangeMinCents,
  rangeMaxCents,
}: {
  token: string;
  companyAddress: string;
  anchorContractId: string;
  defaultName: string;
  usdcCode: string;
  usdcIssuer: string;
  // The agreed range (USDC cents) the worker co-signs on-chain at anchor time.
  rangeMinCents: number;
  rangeMaxCents: number;
}) {
  const { ready, authenticated, login, user, getAccessToken } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();

  // Signing in with Privy (email OTP / Google OAuth) reloads the page, which
  // would wipe what the collaborator typed. Persist the form to sessionStorage
  // and restore it on mount so their name, ID and declaration survive the round
  // trip (#5). Keyed by token so a different invite never restores stale input.
  const storageKey = `sp:invite:${token.slice(0, 24)}`;

  const [name, setName] = useState(defaultName);
  const [cpf, setCpf] = useState('');
  const [declared, setDeclared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddr, setWalletAddr] = useState<string | null>(null);
  const walletReq = useRef(false);
  const reconcileReq = useRef(false);

  // Restore any saved input on mount (after a login reload).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { name?: string; cpf?: string; declared?: boolean };
      if (saved.name) setName(saved.name);
      if (saved.cpf) setCpf(saved.cpf);
      if (saved.declared) setDeclared(true);
    } catch {
      /* ignore malformed storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on every change so the login reload cannot lose it.
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ name, cpf, declared }));
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [name, cpf, declared, storageKey]);

  // Pre-create the embedded Stellar wallet as soon as the collaborator is
  // authenticated. Creating it and signing with it in the same tick fails with
  // "Wallet not found" because the Privy user context has not refreshed yet, so
  // we create it on a prior render and only sign once it is ready.
  useEffect(() => {
    if (!authenticated || walletReq.current) return;
    walletReq.current = true;
    (async () => {
      try {
        const existing = (user?.linkedAccounts ?? []).find(
          (a: any) => a?.type === 'wallet' && a?.chainType === 'stellar' && a?.address,
        ) as any;
        if (existing?.address) {
          setWalletAddr(existing.address);
          return;
        }
        const { wallet } = await createWallet({ chainType: 'stellar' });
        setWalletAddr(wallet.address);
      } catch {
        walletReq.current = false; // allow a retry
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  // Ask the server whether this invite is already anchored on-chain, and record
  // it if so. Used both to self-heal a stuck "pending" state on mount and to
  // recover after an anchor call throws (AlreadyAnchored / FAILED on retry).
  async function reconcileAnchor(): Promise<boolean> {
    try {
      const res = await fetch('/api/invite/anchored', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      return Boolean(data?.anchored);
    } catch {
      return false;
    }
  }

  // Self-heal: if a prior attempt already anchored on-chain but our record stayed
  // pending (the browser closed mid-wait), pick that up on mount and go straight
  // to the portal instead of asking the collaborator to anchor again (#5).
  useEffect(() => {
    if (!authenticated || !walletAddr || done || reconcileReq.current) return;
    reconcileReq.current = true;
    void reconcileAnchor().then((anchored) => {
      if (anchored) setDone(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, walletAddr, done]);

  // After accepting, the collaborator is already authenticated with Privy, so
  // open a worker session and send them straight to their portal instead of
  // asking them to sign in again.
  async function goToPortal() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    try {
      const token = await getAccessToken();
      await fetch('/api/auth/privy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, role: 'worker' }),
      });
    } catch {
      /* if the bridge fails, /payments will route through /login */
    }
    window.location.href = '/payments';
  }

  useEffect(() => {
    if (done) void goToPortal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  async function getStellarWallet(): Promise<string> {
    if (walletAddr) return walletAddr;
    const existing = (user?.linkedAccounts ?? []).find(
      (a: any) => a?.type === 'wallet' && a?.chainType === 'stellar' && a?.address,
    ) as any;
    if (existing?.address) return existing.address;
    const { wallet } = await createWallet({ chainType: 'stellar' });
    setWalletAddr(wallet.address);
    return wallet.address;
  }

  async function anchorOnChain(addr: string, cpfHash: string): Promise<string> {
    return anchorIdentity({
      addr,
      companyAddress,
      anchorContractId,
      cpfHash,
      signRawHash,
      rangeMinCents,
      rangeMaxCents,
    });
  }

  // Best-effort: open a USDC trustline so the worker can receive the USDC
  // settlement rail. If it fails or is skipped, settlements fall back to the
  // native marker, so this never blocks acceptance.
  async function addUsdcTrustline(addr: string): Promise<void> {
    const sdk: any = await import('@stellar/stellar-sdk');
    const { Horizon, Asset, Operation, TransactionBuilder, Networks, BASE_FEE, Keypair, xdr } = sdk;
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(addr);
    const already = account.balances.some(
      (b: any) => b.asset_code === usdcCode && b.asset_issuer === usdcIssuer,
    );
    if (already) return;

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.changeTrust({ asset: new Asset(usdcCode, usdcIssuer) }))
      .setTimeout(120)
      .build();

    const hashHex = ('0x' + tx.hash().toString('hex')) as `0x${string}`;
    const { signature } = await signRawHash({ address: addr, chainType: 'stellar', hash: hashHex });
    const sigBuf = Buffer.from(signature.replace(/^0x/, ''), 'hex');
    tx.signatures.push(
      new xdr.DecoratedSignature({ hint: Keypair.fromPublicKey(addr).signatureHint(), signature: sigBuf }),
    );
    await server.submitTransaction(tx);
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

      setStep('Enabling the USDC rail…');
      await addUsdcTrustline(addr).catch(() => {}); // best-effort, never blocks

      setStep('Finishing…');
      await fetch('/api/invite/anchored', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, tx_hash: txHash }),
      });
      setDone(true);
    } catch (e: any) {
      const msg = String(e?.message || e);
      // Idempotent recovery: the anchor may already exist on-chain (a prior
      // attempt succeeded, or AlreadyAnchored / FAILED on a retry). Confirm with
      // the server before treating this as a real failure, so we never dead-end
      // a collaborator who is in fact already anchored (#5).
      setStep('Checking your anchor…');
      // reconcileAnchor both confirms on-chain and records it, so an
      // AlreadyAnchored retry lands the company in the anchored state too.
      const anchored = await reconcileAnchor();
      if (anchored) {
        setDone(true);
      } else {
        setError(msg);
        toast.error('We could not finish anchoring. Nothing was charged. Please try again.');
      }
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
          Your wallet is linked and your identity is anchored on-chain. Opening your portal…
        </p>
        <Button asChild className="w-full">
          <a href="/payments">Go to my portal</a>
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
      ) : !walletAddr ? (
        <Button className="w-full" size="lg" disabled>
          Preparing your wallet…
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
