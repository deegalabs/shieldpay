import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { signScopedToken } from '@/lib/auth/session';

export const runtime = 'nodejs';

/**
 * POST /api/auth/auditor-link  { days?: number }
 * Company-only. Mints a read-only, expiring auditor link (no wallet needed).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'company') {
    return NextResponse.json({ error: 'company session required' }, { status: 403 });
  }
  const { days = 30 } = await req.json().catch(() => ({}));
  const clamped = Math.min(Math.max(Number(days) || 30, 1), 365);
  const token = await signScopedToken({ scope: 'audit' }, `${clamped}d`);
  return NextResponse.json({ url: `/audit/${token}`, expiresInDays: clamped });
}
