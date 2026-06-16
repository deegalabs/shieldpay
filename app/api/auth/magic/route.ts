import { NextRequest, NextResponse } from 'next/server';
import { signScopedToken } from '@/lib/auth/session';

export const runtime = 'nodejs';

/**
 * POST /api/auth/magic  { email, role? }
 * Issues a 15-minute magic link. MVP: if no email provider is configured, the
 * link is returned in the response (dev mode) so the flow is usable end-to-end.
 */
export async function POST(req: NextRequest) {
  const { email, role } = await req.json().catch(() => ({}));
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'valid email required' }, { status: 400 });
  }
  const r = role === 'company' ? 'company' : 'worker';
  const token = await signScopedToken({ email, role: r, scope: 'magic' }, '15m');

  const origin =
    req.headers.get('x-forwarded-host')
      ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('x-forwarded-host')}`
      : req.nextUrl.origin;
  const link = `${origin}/api/auth/magic/callback?token=${token}`;

  // TODO(prod): if process.env.RESEND_API_KEY (or SMTP) is set, send `link` by email.
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  return NextResponse.json({
    ok: true,
    sent: emailConfigured,
    // Dev mode: expose the link so it can be used without an email provider.
    link: emailConfigured ? undefined : link,
  });
}
