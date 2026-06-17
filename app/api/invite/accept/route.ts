import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyScopedToken } from '@/lib/auth/session';
import { acceptInvite } from '@/lib/db/client';

export const runtime = 'nodejs';

const Body = z.object({
  token: z.string(),
  stellar_address: z.string().startsWith('G').min(56),
});

/**
 * POST /api/invite/accept — public. The collaborator accepts an invite by
 * providing the wallet they will receive at. Sets the contractor to 'active'.
 * (On-chain self-anchor of that wallet is N2.)
 */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const claims = await verifyScopedToken<{ scope: string; cid: string }>(parsed.data.token);
  if (!claims || claims.scope !== 'invite') {
    return NextResponse.json({ error: 'invalid or expired invite' }, { status: 400 });
  }

  const updated = await acceptInvite(claims.cid, parsed.data.stellar_address);
  if (!updated) {
    return NextResponse.json({ error: 'invite already accepted or not found' }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
