import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isCredentialPresented, getCredentialOnChain } from '@/lib/stellar/soroban';
import { rateLimited } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  // The presentation nullifier, 32 bytes hex (public signal 0).
  nullifier: z.string().regex(/^[0-9a-fA-F]{64}$/, 'nullifier must be 32 bytes hex'),
  // Optional credential id, so the full record (range, employer, worker binding)
  // can be shown. Without it, only the "presented" flag is available on-chain.
  id: z.string().regex(/^\d+$/).optional(),
});

/**
 * POST /api/income/verify — public, wallet-free proof-of-income lookup. Anyone can
 * confirm a credential straight from the deployed income verifier via a read-only
 * Soroban simulate (no session, no signature, no funds moved). `presented` is the
 * on-chain record flag: true means this exact credential was verified by the
 * contract's pairing check and recorded, so it cannot be re-recorded. When an id is
 * supplied and its record is bound to the same nullifier, the proven range and
 * employer attestation are returned too. No monthly amount is ever exposed.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimited(req, 'income-verify', 30, 60_000);
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  const nullifierHex = parsed.data.nullifier.toLowerCase();
  const nullifier = Buffer.from(nullifierHex, 'hex');

  const presented = await isCredentialPresented(nullifier);

  let record: Record<string, unknown> | null = null;
  if (parsed.data.id) {
    const rec = await getCredentialOnChain(parsed.data.id);
    // Only surface the record if it is genuinely the one bound to this nullifier.
    if (rec && typeof rec.nullifier === 'string' && rec.nullifier.toLowerCase() === nullifierHex) {
      record = rec;
    }
  }

  return NextResponse.json({ presented, record });
}
