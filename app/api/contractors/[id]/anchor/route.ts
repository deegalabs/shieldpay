import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireCompany } from '@/lib/auth/server';
import { getContractor, setContractorAnchored } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/contractors/[id]/anchor
 * Demo-only: flips the contractor's anchored flag in the database WITHOUT any
 * on-chain signature, so the payroll flow can be shown end to end without a
 * second device. A real anchor requires the WORKER's own key (require_auth on
 * their address) and is signed from the contributor's portal. Outside the demo
 * this shortcut is rejected, so a company cannot mark someone anchored who never
 * actually signed.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  const company = auth.company;

  const session = await getSession();
  if (session?.method !== 'demo') {
    return NextResponse.json(
      { error: 'the contributor must sign their own on-chain anchor from their portal' },
      { status: 403 },
    );
  }

  const contractor = await getContractor(params.id, company.id);
  if (!contractor) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await setContractorAnchored(params.id, company.id, '');
  return NextResponse.json({ ok: true, anchored: true });
}
