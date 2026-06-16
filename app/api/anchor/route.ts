import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashCpf } from '@/lib/stellar/auth';
import { buildAnchorTx } from '@/lib/stellar/transactions';

/**
 * POST /api/anchor
 * Builds the worker's identity-anchor transaction (layer 2).
 *
 * The worker signs from their own wallet. For the demo we accept the worker
 * secret server-side; production builds an unsigned XDR for Freighter to sign.
 */
const Body = z.object({
  workerSecret: z.string().min(50),
  companyAddress: z.string().startsWith('G'),
  contractId: z.number().int().positive(),
  cpf: z.string().min(11),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { workerSecret, companyAddress, contractId, cpf } = parsed.data;

  const { xdr, memo } = await buildAnchorTx({
    workerSecret,
    companyAddress,
    contractId,
    cpfHash: hashCpf(cpf),
  });

  // TODO: submit the signed tx and call AnchorRegistry.anchor; persist in DB.
  return NextResponse.json({ xdr, memo, cpfHash: hashCpf(cpf) });
}
