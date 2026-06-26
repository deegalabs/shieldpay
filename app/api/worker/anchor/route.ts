import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/server';
import { listContractorsByAddress, setInviteAnchored } from '@/lib/db/client';

export const runtime = 'nodejs';

const Body = z.object({ contractorId: z.union([z.string(), z.number()]), tx_hash: z.string().min(1) });

/**
 * POST /api/worker/anchor  { contractorId, tx_hash }
 * Worker-only. Records the on-chain identity anchor for one of the worker's own
 * contracts, after they completed the anchor transaction from their portal. The
 * contractor must belong to the authenticated worker (matched by wallet).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'worker') {
    return NextResponse.json({ error: 'worker session required' }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'contractorId and tx_hash required' }, { status: 400 });
  const contractorId = String(parsed.data.contractorId);

  let owns = false;
  try {
    const mine = await listContractorsByAddress(session.sub);
    owns = mine.some((c) => String(c.id) === contractorId);
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
  if (!owns) return NextResponse.json({ error: 'not your contract' }, { status: 403 });

  await setInviteAnchored(contractorId, parsed.data.tx_hash);
  return NextResponse.json({ ok: true });
}
