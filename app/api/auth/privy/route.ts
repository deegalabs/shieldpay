import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { signSession, SESSION_COOKIE, cookieOptions, type Role } from '@/lib/auth/session';
import { rateLimited } from '@/lib/auth/server';
import { listContractorsByAddress, getCompanyByOwner } from '@/lib/db/client';

export const runtime = 'nodejs';

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;

/**
 * POST /api/auth/privy  { token, role }
 * Bridge: verify the Privy access token server-side, then issue OUR session
 * cookie so the existing middleware/RBAC/portals work unchanged.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimited(req, 'privy', 30, 60_000);
  if (limited) return limited;
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

  // Route each persona to its own portal automatically, so nobody has to pick a
  // role (and cannot pick the wrong one). A signer whose wallet is a registered
  // contributor lands in the contributor portal; a company owner always resolves
  // to the company workspace (it wins even if the same address is also a
  // contributor somewhere); everyone else starts a company. The client `role` is
  // only a fallback hint when the database is unreachable.
  const sub = stellarAddress || userId;
  let r: Role = role === 'worker' ? 'worker' : 'company';
  try {
    if (stellarAddress) {
      const asContractor = await listContractorsByAddress(stellarAddress);
      if (asContractor.length > 0) r = 'worker';
    }
    const ownsCompany = await getCompanyByOwner(sub).catch(() => null);
    if (ownsCompany) r = 'company';
  } catch {
    /* keep the fallback role if the lookups fail */
  }

  const sessionToken = await signSession({
    sub,
    role: r,
    name,
    method: 'privy',
  });
  const res = NextResponse.json({ ok: true, role: r });
  res.cookies.set(SESSION_COOKIE, sessionToken, cookieOptions);
  return res;
}
