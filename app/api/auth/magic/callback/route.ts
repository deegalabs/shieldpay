import { NextRequest, NextResponse } from 'next/server';
import {
  verifyScopedToken,
  signSession,
  SESSION_COOKIE,
  cookieOptions,
  type Role,
} from '@/lib/auth/session';

export const runtime = 'nodejs';

/** GET /api/auth/magic/callback?token=  — verify the link and start a session. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const claims = token
    ? await verifyScopedToken<{ email: string; role: Role; scope: string }>(token)
    : null;

  if (!claims || claims.scope !== 'magic') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '?error=magic_invalid';
    return NextResponse.redirect(url);
  }

  const session = await signSession({
    sub: claims.email,
    role: claims.role,
    name: claims.email,
    method: 'magic',
  });
  const dest = req.nextUrl.clone();
  dest.pathname = claims.role === 'company' ? '/dashboard' : '/payments';
  dest.search = '';
  const res = NextResponse.redirect(dest);
  res.cookies.set(SESSION_COOKIE, session, cookieOptions);
  return res;
}
