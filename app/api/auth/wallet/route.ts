import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@/lib/stellar/auth';
import {
  signSession,
  verifyScopedToken,
  SESSION_COOKIE,
  cookieOptions,
} from '@/lib/auth/session';
import { COMPANY } from '@/lib/constants';

export const runtime = 'nodejs';

/**
 * POST /api/auth/wallet
 * { address, message, signature (base64), challengeToken }
 * Verifies the wallet signature over the issued challenge, then starts a session.
 * Role: company iff the address is the configured company key, else worker.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  const { address, message, signature, challengeToken } = body;

  const claims = await verifyScopedToken<{ message: string; address: string }>(challengeToken);
  if (!claims || claims.message !== message || claims.address !== address) {
    return NextResponse.json({ error: 'invalid or expired challenge' }, { status: 400 });
  }
  if (!verifySignature(address, message, signature)) {
    return NextResponse.json({ error: 'signature verification failed' }, { status: 401 });
  }

  const role = address === process.env.COMPANY_PUBLIC_KEY ? 'company' : 'worker';
  const token = await signSession({
    sub: address,
    role,
    name: role === 'company' ? COMPANY.name : `${address.slice(0, 4)}…${address.slice(-4)}`,
    method: 'wallet',
  });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return res;
}
