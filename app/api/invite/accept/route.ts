import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyScopedToken } from '@/lib/auth/session';
import { acceptInvite } from '@/lib/db/client';
import { hashCpf } from '@/lib/stellar/auth';

export const runtime = 'nodejs';

const Body = z.object({
  token: z.string(),
  stellar_address: z.string().startsWith('G').min(56),
  cpf: z.string().min(3).optional(),
  name: z.string().min(2).optional(),
});

/**
 * POST /api/invite/accept — public. The collaborator accepts: links the wallet
 * they control and declares their identity (ID/CPF stored only as a hash).
 * Returns the cpf_hash so the client can bind it into the on-chain anchor.
 */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const claims = await verifyScopedToken<{ scope: string; cid: string }>(parsed.data.token);
  if (!claims || claims.scope !== 'invite') {
    return NextResponse.json({ error: 'invalid or expired invite' }, { status: 400 });
  }

  const cpfHash = parsed.data.cpf ? hashCpf(parsed.data.cpf) : null;
  const updated = await acceptInvite(claims.cid, {
    stellarAddress: parsed.data.stellar_address,
    cpfHash,
    name: parsed.data.name ?? null,
  });
  if (!updated) {
    return NextResponse.json({ error: 'invite not found' }, { status: 409 });
  }
  return NextResponse.json({ ok: true, cpf_hash: cpfHash });
}
