import { NextRequest, NextResponse } from 'next/server';
import { requireCompany } from '@/lib/auth/server';
import { getContractor, setContractorAnchored } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/contractors/[id]/anchor
 * Marks the contractor's identity (CPF ↔ Stellar address) as anchored.
 *
 * MVP NOTE: the cryptographic, worker-signed self-anchor on the deployed
 * AnchorRegistry contract requires the WORKER's key (require_auth on their
 * address). That step lands once the contractor authenticates with their own
 * Stellar wallet (Privy embedded wallet — see R4 follow-up). Here we record the
 * anchored status off-chain so the payroll flow can proceed in the demo.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  const company = auth.company;

  const contractor = await getContractor(params.id, company.id);
  if (!contractor) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await setContractorAnchored(params.id, company.id, '');
  return NextResponse.json({ ok: true, anchored: true });
}
