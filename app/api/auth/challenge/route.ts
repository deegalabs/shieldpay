import { NextRequest, NextResponse } from 'next/server';
import { createChallenge } from '@/lib/stellar/auth';
import { signScopedToken } from '@/lib/auth/session';

export const runtime = 'nodejs';

/**
 * GET /api/auth/challenge?address=G...
 * Returns a challenge to sign with the wallet, plus a stateless, short-lived
 * token binding the challenge (so we need no server-side challenge store).
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address || !address.startsWith('G')) {
    return NextResponse.json({ error: 'valid Stellar address required' }, { status: 400 });
  }
  const ch = createChallenge(address);
  const challengeToken = await signScopedToken({ message: ch.message, address }, '5m');
  return NextResponse.json({ message: ch.message, challengeToken });
}
