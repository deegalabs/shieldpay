import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, getContractor } from '@/lib/db/client';
import { signScopedToken } from '@/lib/auth/session';

export const runtime = 'nodejs';

/** GET /api/contractors/[id]/invite-link — re-mint the invite link (copy/resend). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'company') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const company = await getCompanyByOwner(session.sub);
  if (!company) return NextResponse.json({ error: 'company not found' }, { status: 404 });

  const contractor = await getContractor(params.id, company.id);
  if (!contractor) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (contractor.status !== 'invited') {
    return NextResponse.json({ error: 'contractor already active' }, { status: 409 });
  }

  const token = await signScopedToken({ scope: 'invite', cid: contractor.id }, '30d');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const base = host ? `${proto}://${host}` : req.nextUrl.origin;
  return NextResponse.json({ url: `${base}/invite/${token}` });
}
