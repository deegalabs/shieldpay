import { NextRequest, NextResponse } from 'next/server';
import { signSession, SESSION_COOKIE, cookieOptions, type Role } from '@/lib/auth/session';
import { COMPANY, DEMO_WORKER, DEMO_COMPANY_SUB, ALLOW_DEMO_LOGIN } from '@/lib/constants';
import { rateLimited } from '@/lib/auth/server';

export const runtime = 'nodejs';

/**
 * POST /api/auth/demo  { role: 'company' | 'worker' }
 * One-click demo login so the hackathon demo works without a wallet extension.
 * The company demo is scoped to an isolated identity (DEMO_COMPANY_SUB), never
 * the real treasury-owning account (A4).
 */
export async function POST(req: NextRequest) {
  if (!ALLOW_DEMO_LOGIN) {
    return NextResponse.json({ error: 'demo login is disabled' }, { status: 403 });
  }
  const limited = rateLimited(req, 'demo', 30, 60_000);
  if (limited) return limited;
  const { role } = await req.json().catch(() => ({ role: 'company' }));
  const r: Role = role === 'worker' ? 'worker' : 'company';

  const session =
    r === 'company'
      ? {
          sub: DEMO_COMPANY_SUB,
          role: 'company' as const,
          name: COMPANY.name,
          method: 'demo' as const,
        }
      : {
          sub: DEMO_WORKER.address,
          role: 'worker' as const,
          name: DEMO_WORKER.name,
          method: 'demo' as const,
        };

  const token = await signSession(session);
  const res = NextResponse.json({ ok: true, role: r });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return res;
}
