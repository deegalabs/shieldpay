'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { anchorIdentity } from '@/lib/stellar/anchor-client';

/**
 * Lets a collaborator finish a pending on-chain identity anchor from their
 * portal, without needing a fresh invite. Signs the AnchorRegistry transaction
 * with their own wallet, then records it against their contract.
 */
export function CompleteAnchor({
  contractorId,
  companyAddress,
  anchorContractId,
  cpfHash,
}: {
  contractorId: string;
  companyAddress: string;
  anchorContractId: string;
  cpfHash: string;
}) {
  const { ready, authenticated, user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !ready || !authenticated || busy || !companyAddress || !anchorContractId;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const addr = (user?.linkedAccounts ?? []).find(
        (a: any) => a?.type === 'wallet' && a?.chainType === 'stellar' && a?.address,
      ) as any;
      if (!addr?.address) throw new Error('No Stellar wallet is linked to your account.');

      const txHash = await anchorIdentity({
        addr: addr.address,
        companyAddress,
        anchorContractId,
        cpfHash,
        signRawHash,
      });
      const res = await fetch('/api/worker/anchor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contractorId, tx_hash: txHash }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'could not record the anchor');
      }
      window.location.reload();
    } catch (e: any) {
      const msg = String(e?.message || e);
      // If it was already anchored on-chain, just refresh to pick up the state.
      if (/AlreadyAnchored|#1\b/.test(msg)) {
        window.location.reload();
        return;
      }
      setError(msg);
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
