import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, rotateDiscloseEpoch } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/auth/auditor-link/rotate
 * Company-only. Bumps the disclosure epoch, instantly revoking every
 * outstanding viewing-key (disclose) link. Existing links drop to read-only.
 */
export async function POST(_req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'company') {
    return NextResponse.json({ error: 'company session required' }, { status: 403 });
  }
  let company = null;
  try {
    company = await getCompanyByOwner(session.sub);
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
  if (!company) {
    return NextResponse.json({ error: 'company not found' }, { status: 404 });
  }
  const epoch = await rotateDiscloseEpoch(company.id);
  return NextResponse.json({ ok: true, epoch });
}
