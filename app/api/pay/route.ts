import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildPaymentTx, submit } from '@/lib/stellar/transactions';

/**
 * POST /api/pay
 * Orchestrates a single payout: send USDC + structured memo (layer 3).
 *
 * Full flow (wired incrementally):
 *   1. validate worker is anchored (AnchorRegistry.is_anchored)
 *   2. generate ZK proof (/api/proof)
 *   3. send USDC payment  <-- this endpoint
 *   4. record proof on-chain (PaymentVerifier.verify_and_record)
 *   5. render receipt PDF
 */
const Body = z.object({
  workerAddress: z.string().startsWith('G'),
  amountUsdc: z.string().regex(/^\d+(\.\d{1,7})?$/),
  contractId: z.number().int().positive(),
  reference: z.string().min(1),
  proofId: z.union([z.number(), z.string()]),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const companySecret = process.env.COMPANY_SECRET_KEY;
  if (!companySecret) {
    return NextResponse.json({ error: 'COMPANY_SECRET_KEY not configured' }, { status: 500 });
  }

  try {
    const { xdr, memo, hash } = await buildPaymentTx({ companySecret, ...parsed.data });
    const result = await submit(xdr);
    return NextResponse.json({ ok: true, hash, memo, ledger: result.ledger });
  } catch (e) {
    return NextResponse.json({ error: 'payment failed', detail: String(e) }, { status: 500 });
  }
}
