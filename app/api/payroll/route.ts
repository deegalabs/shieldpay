import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, ensureCompanyViewingKey } from '@/lib/db/client';
import { proveAndRecordPayment } from '@/lib/payments/flow';
import { EXPLORER_BASE } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({
  workerName: z.string().min(1),
  workerAddress: z.string().min(1),
  amountUsdc: z.number().positive(),
  minUsdc: z.number().nonnegative(),
  maxUsdc: z.number().positive(),
  reference: z.string().min(1),
});

/** POST /api/payroll — a single "Pay & Prove" (amount stays private). */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const companySecret = process.env.COMPANY_SECRET_KEY;
  if (!companySecret) return NextResponse.json({ error: 'COMPANY_SECRET_KEY not configured' }, { status: 500 });

  try {
    const session = await getSession();
    const company = session ? await getCompanyByOwner(session.sub) : null;
    const viewingKey = company ? await ensureCompanyViewingKey(company.id) : null;
    const { proofId, txHash } = await proveAndRecordPayment({
      companySecret,
      company,
      input: parsed.data,
      viewingKey,
    });
    return NextResponse.json({
      ok: true,
      workerName: parsed.data.workerName,
      reference: parsed.data.reference,
      range: { min: parsed.data.minUsdc, max: parsed.data.maxUsdc },
      proofId,
      onChain: { txHash, explorerUrl: `${EXPLORER_BASE}/tx/${txHash}`, verified: true },
    });
  } catch (e) {
    console.error('payment failed', e);
    return NextResponse.json({ error: 'payment failed' }, { status: 500 });
  }
}
