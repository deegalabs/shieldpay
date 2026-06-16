import { NextRequest, NextResponse } from 'next/server';
import { getPayment } from '@/lib/db/client';
import { generateReceiptPdf } from '@/lib/pdf/receipt';
import { COMPANY, EXPLORER_BASE } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/receipt?id=<paymentId>
 * The "Legal Defense" document: a court-grade PDF for a recorded payment proof.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 });
  }

  let payment;
  try {
    payment = await getPayment(id);
  } catch (e) {
    return NextResponse.json({ error: 'database unavailable', detail: String(e) }, { status: 503 });
  }
  if (!payment) {
    return NextResponse.json({ error: 'payment not found' }, { status: 404 });
  }

  const pdf = await generateReceiptPdf({
    companyName: COMPANY.name,
    companyCnpj: COMPANY.cnpj,
    workerName: payment.worker_name,
    workerAddress: payment.worker_address,
    reference: payment.reference,
    range: { min: payment.range_min / 100, max: payment.range_max / 100 },
    proofId: payment.proof_id,
    txHash: payment.tx_hash,
    explorerUrl: `${EXPLORER_BASE}/tx/${payment.tx_hash}`,
    issuedAt: payment.created_at,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="shieldpay-proof-${payment.reference}-${id}.pdf"`,
    },
  });
}
