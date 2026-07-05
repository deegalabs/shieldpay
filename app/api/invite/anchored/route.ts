import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyScopedToken } from '@/lib/auth/session';
import { getInvite, setInviteAnchored } from '@/lib/db/client';
import { isAnchoredOnChain } from '@/lib/stellar/soroban';

export const runtime = 'nodejs';

const Body = z.object({
  token: z.string(),
  // Optional: present on the fresh-success path, absent on the reconcile path.
  tx_hash: z.string().min(8).optional(),
});

/**
 * POST /api/invite/anchored — public, token-gated. Records that the collaborator
 * completed the on-chain self-anchor (signed by their own Privy Stellar wallet).
 *
 * Two modes, so the flow is idempotent and self-healing (#5):
 *  - Fresh success: a `tx_hash` is supplied, the client just confirmed the
 *    anchor transaction, so we record it.
 *  - Reconcile: no `tx_hash`. A prior attempt may have anchored on-chain while
 *    our record stayed "pending" (the browser closed mid-wait), or a retry hit
 *    AlreadyAnchored. We confirm against the AnchorRegistry (the source of
 *    truth) before marking, so we never record an anchor that does not exist.
 */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const claims = await verifyScopedToken<{ scope: string; cid: string }>(parsed.data.token);
  if (!claims || claims.scope !== 'invite') {
    return NextResponse.json({ error: 'invalid or expired invite' }, { status: 400 });
  }

  if (parsed.data.tx_hash) {
    await setInviteAnchored(claims.cid, parsed.data.tx_hash);
    return NextResponse.json({ ok: true, anchored: true });
  }

  let invite;
  try {
    invite = await getInvite(claims.cid);
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
  if (!invite?.stellar_address) return NextResponse.json({ ok: true, anchored: false });

  const companyAddress = /^G[A-Z2-7]{55}$/.test(invite.company_treasury || '')
    ? invite.company_treasury!
    : process.env.COMPANY_PUBLIC_KEY || '';
  const anchored = await isAnchoredOnChain(invite.stellar_address, companyAddress);
  if (anchored) {
    await setInviteAnchored(claims.cid, invite.anchor_tx_hash || 'onchain');
    return NextResponse.json({ ok: true, anchored: true });
  }
  return NextResponse.json({ ok: true, anchored: false });
}
