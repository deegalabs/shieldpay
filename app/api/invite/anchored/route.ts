import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyScopedToken } from '@/lib/auth/session';
import { setInviteAnchored } from '@/lib/db/client';

export const runtime = 'nodejs';

const Body = z.object({
  token: z.string(),
  tx_hash: z.string().min(8),
});

/**
 * POST /api/invite/anchored — public, token-gated. Records that the collaborator
 * completed the on-chain self-anchor (signed by their own Privy Stellar wallet).
 */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const claims = await verifyScopedToken<{ scope: string; cid: string }>(parsed.data.token);
  if (!claims || claims.scope !== 'invite') {
    return NextResponse.json({ error: 'invalid or expired invite' }, { status: 400 });
  }
  await setInviteAnchored(claims.cid, parsed.data.tx_hash);
  return NextResponse.json({ ok: true });
}
