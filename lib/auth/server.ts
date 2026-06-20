import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession, type Session } from './session';
import { getCompanyByOwner, type CompanyRow } from '@/lib/db/client';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * Apply a rate limit for `key` + client IP. Returns a 429 response if over the
 * limit, or null if the request may proceed.
 */
export function rateLimited(req: Request, key: string, limit: number, windowMs: number): NextResponse | null {
  const rl = rateLimit(`${key}:${clientIp(req)}`, limit, windowMs);
  if (rl.ok) return null;
  return NextResponse.json(
    { error: 'too many requests' },
    { status: 429, headers: { 'retry-after': String(rl.retryAfter) } },
  );
}

/** Read the current session in a server component / route handler. */
export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

type CompanyAuth = { ok: true; company: CompanyRow } | { ok: false; res: NextResponse };

/**
 * Resolve the company for the current session, or the response to return.
 * Centralizes the company-route guard: 403 if not a company session, 404 if the
 * company has not been set up, 503 if the database is unavailable.
 */
export async function requireCompany(): Promise<CompanyAuth> {
  const session = await getSession();
  if (!session || session.role !== 'company') {
    return { ok: false, res: NextResponse.json({ error: 'company session required' }, { status: 403 }) };
  }
  try {
    const company = await getCompanyByOwner(session.sub);
    if (!company) {
      return { ok: false, res: NextResponse.json({ error: 'company not found' }, { status: 404 }) };
    }
    return { ok: true, company };
  } catch (e) {
    console.error('company lookup failed', e);
    return { ok: false, res: NextResponse.json({ error: 'database unavailable' }, { status: 503 }) };
  }
}
