'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { anchorIdentity } from '@/lib/stellar/anchor-client';
import { truncateKey } from '@/lib/utils';

/**
 * Lets a collaborator finish a pending on-chain identity anchor from their
 * portal, without needing a fresh invite. Signs the AnchorRegistry transaction
 * with their own wallet, then records it against their contract. The anchor is
 * only valid when the connected wallet IS the account on this contract, so we
 * guard for a mismatch (e.g. the one-click demo worker, whose address is a
 * placeholder, cannot be anchored on-chain).
 */
export function CompleteAnchor({
  contractorId,
  workerAddress,
  companyAddress,
  anchorContractId,
  cpfHash,
  rangeMinCents,
  rangeMaxCents,
}: {
  contractorId: string;
  workerAddress: string;
  companyAddress: string;
  anchorContractId: string;
  cpfHash: string;
  // The agreed range (USDC cents) the worker co-signs on-chain at anchor time.
  rangeMinCents: number;
  rangeMaxCents: number;
}) {
  const { ready, authenticated, user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = (user?.linkedAccounts ?? []).find(
    (a: any) => a?.type === 'wallet' && a?.chainType === 'stellar' && a?.address,
  ) as any;
  const walletAddr: string | undefined = wallet?.address;
  const mismatch = !!walletAddr && !!workerAddress && walletAddr !== workerAddress;

  // The connected wallet is not the account on this contract (or it is the demo
  // placeholder): anchoring on-chain cannot work, so explain instead of failing.
  if (ready && (mismatch || !authenticated)) {
    return (
      <p className="mt-3 text-xs text-muted">
        Sign in with the wallet for this account
        {workerAddress ? ` (${truncateKey(workerAddress)})` : ''} to finish anchoring.
      </p>
    );
  }

  const disabled = !ready || busy || !companyAddress || !anchorContractId;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      if (!walletAddr) throw new Error('No Stellar wallet is linked to your account.');

      const txHash = await anchorIdentity({
        addr: walletAddr,
        companyAddress,
        anchorContractId,
        cpfHash,
        signRawHash,
        rangeMinCents,
        rangeMaxCents,
        contractorId,
      });
      const res = await fetch('/api/worker/anchor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contractorId, tx_hash: txHash }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `could not record the anchor (HTTP ${res.status})`);
      }
      toast.success('Identity anchored on-chain');
      window.location.reload();
    } catch (e: any) {
      const msg = String(e?.message || e);
      // Idempotent recovery: the anchor may already exist on-chain (a retry hit
      // AlreadyAnchored / FAILED). /api/worker/anchor independently verifies
      // is_anchored on-chain, so ask it to record without a fresh hash; if the
      // anchor is really there, we pick the state up on reload.
      try {
        const res = await fetch('/api/worker/anchor', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ contractorId }),
        });
        if (res.ok) {
          toast.success('Identity anchored on-chain');
          window.location.reload();
          return;
        }
      } catch {
        /* fall through to surfacing the original error */
      }
      setError(msg);
      toast.error('We could not finish anchoring. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <Button size="sm" disabled={disabled} onClick={run}>
        <ShieldCheck size={14} /> {busy ? 'Anchoring…' : 'Complete identity anchor'}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
