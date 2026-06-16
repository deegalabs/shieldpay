import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { signSession, SESSION_COOKIE, cookieOptions, type Role } from '@/lib/auth/session';

export const runtime = 'nodejs';

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;

/**
 * POST /api/auth/privy  { token, role }
 * Bridge: verify the Privy access token server-side, then issue OUR session
 * cookie so the existing middleware/RBAC/portals work unchanged.
 */
export async function POST(req: NextRequest) {
  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Privy not configured' }, { status: 500 });
  }
  const { token, role } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const client = new PrivyClient(appId, appSecret);
  let userId: string;
  try {
    const claims = await client.verifyAuthToken(token);
    userId = claims.userId;
  } catch {
    return NextResponse.json({ error: 'invalid Privy token' }, { status: 401 });
  }

  // Best-effort: pull a human label + any linked Stellar wallet.
  let name = 'Account';
  let stellarAddress: string | undefined;
  try {
    const user: any = await client.getUser(userId);
    name = user?.email?.address || user?.google?.email || user?.phone?.number || name;
    const acct = (user?.linkedAccounts || []).find(
      (a: any) => a?.chainType === 'stellar' && a?.address,
    );
    stellarAddress = acct?.address;
  } catch {
    /* non-fatal */
  }

  const r: Role = role === 'company' ? 'company' : 'worker';
  const sessionToken = await signSession({
    sub: stellarAddress || userId,
    role: r,
    name,
    method: 'privy',
  });
  const res = NextResponse.json({ ok: true, role: r });
  res.cookies.set(SESSION_COOKIE, sessionToken, cookieOptions);
  return res;
}
