import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProofRecordOnChain } from '@/lib/stellar/soroban';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  // A non-negative integer proof id, taken as a string to avoid float rounding.
  proofId: z.string().regex(/^\d+$/, 'proofId must be a non-negative integer'),
});

/**
 * POST /api/verify-onchain — public, wallet-free proof lookup. Anyone can read a
 * recorded proof record straight from the deployed PaymentVerifier via a
 * read-only Soroban simulate (no session, no signature, no funds moved). The
 * exact amount is never returned: only the on-chain commitment and the proven
 * range are public.
 */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await getProofRecordOnChain(parsed.data.proofId);
  return NextResponse.json({
    found: record != null,
    verified: record != null && record.verified === true,
    record,
  });
}
