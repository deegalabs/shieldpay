'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Collaborator-side invite acceptance: provide the wallet you'll receive at.
 * (N2 will replace the manual address with a Privy-created wallet + on-chain
 * self-anchor; for N1 we capture the address and activate the contractor.)
 */
export function InviteAccept({ token }: { token: string }) {
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function accept() {
    if (!address.startsWith('G') || address.length < 56) {
      toast.error('Enter a valid Stellar address (G…)');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, stellar_address: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.join(', ') || data.error || 'failed');
      setDone(true);
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-lg font-semibold text-primary">You&apos;re all set ✅</p>
        <p className="text-sm text-muted">
          Your wallet is linked. Sign in to your portal to see payments and download receipts.
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
        <Label htmlFor="addr">Your Stellar wallet (where you&apos;ll be paid)</Label>
        <Input
          id="addr"
          className="font-mono text-xs"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="G…"
        />
        <p className="mt-1 text-xs text-muted">
          You keep full control of this wallet. The company never holds your keys.
        </p>
      </div>
      <Button className="w-full" disabled={busy} onClick={accept}>
        {busy ? 'Linking…' : 'Accept invite & link wallet'}
      </Button>
    </div>
  );
}
