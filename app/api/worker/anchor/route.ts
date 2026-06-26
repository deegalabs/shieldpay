import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/server';
import { listContractorsByAddress, setInviteAnchored } from '@/lib/db/client';
import { isAnchoredOnChain } from '@/lib/stellar/soroban';

export const runtime = 'nodejs';

const Body = z.object({
  contractorId: z.union([z.string(), z.number()]),
  tx_hash: z.string().regex(/^[0-9a-f]{64}$/i, 'invalid tx hash'),
});

/**
 * POST /api/worker/anchor  { contractorId, tx_hash }
 * Worker-only. Records the on-chain identity anchor for one of the worker's own
 * contracts. The contractor must belong to the authenticated worker, AND the
 * anchor must actually exist on-chain (AnchorRegistry.is_anchored): the server
 * confirms the binding itself instead of trusting the client-supplied hash.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'worker') {
    return NextResponse.json({ error: 'worker session required' }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'contractorId and a valid tx_hash are required' }, { status: 400 });
  }
  const contractorId = String(parsed.data.contractorId);

  let contractor;
  try {
    const mine = await listContractorsByAddress(session.sub);
    contractor = mine.find((c) => String(c.id) === contractorId);
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
  if (!contractor || !contractor.stellar_address) {
    return NextResponse.json({ error: 'not your contract' }, { status: 403 });
  }

  // The on-chain AnchorRegistry is the source of truth, not the client's hash.
  const companyAddress = /^G[A-Z2-7]{55}$/.test(contractor.company_treasury || '')
    ? contractor.company_treasury!
    : process.env.COMPANY_PUBLIC_KEY || '';
  const anchored = await isAnchoredOnChain(contractor.stellar_address, companyAddress);
  if (!anchored) {
    return NextResponse.json(
      { error: 'no on-chain anchor found for your address yet' },
      { status: 422 },
    );
  }

  await setInviteAnchored(contractorId, parsed.data.tx_hash);
  return NextResponse.json({ ok: true });
}
