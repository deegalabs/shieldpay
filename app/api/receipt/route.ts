import { NextRequest, NextResponse } from 'next/server';
import {
  getPayment,
  getCompanyByOwner,
  getFiscalLinkByPayment,
  type PaymentRow,
} from '@/lib/db/client';
import { getSession } from '@/lib/auth/server';
import { verifyScopedToken, type AuditTokenClaims } from '@/lib/auth/session';
import { generateReceiptPdf, receiptJson } from '@/lib/pdf/receipt';
import { COMPANY, EXPLORER_BASE } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Whether the caller may read this payment's receipt. Access is restricted to
 * the payment's owner: a company session that owns it, the worker whose address
 * received it, or an audit token scoped to the payment's company.
 */
async function canAccess(req: NextRequest, payment: PaymentRow): Promise<boolean> {
  const session = await getSession();
  if (session) {
    if (session.role === 'worker') return payment.worker_address === session.sub;
    if (session.role === 'company') {
      const company = await getCompanyByOwner(session.sub).catch(() => null);
      return !!company && String(company.id) === String(payment.company_id);
    }
  }
  const token = req.nextUrl.searchParams.get('token');
  if (token) {
    const claims = await verifyScopedToken<AuditTokenClaims>(token);
    if (claims && claims.scope === 'audit' && claims.companyId != null) {
      return String(claims.companyId) === String(payment.company_id);
    }
  }
  return false;
}

/**
 * GET /api/receipt?id=<paymentId>[&token=<auditToken>]
 * The verifiable receipt: a plain-language PDF for a recorded payment proof.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 });
  }

  let payment;
  try {
    payment = await getPayment(id);
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
  if (!payment) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  if (!(await canAccess(req, payment))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Optional linked fiscal document (F3). Best-effort: a lookup failure or an
  // unlinked payment simply omits the field. The link is mock-backed for now
  // (see lib/fiscal/adapter.ts), so it is shown as informational only.
  let fiscalDocument: { provider: string; invoiceNumber: string; invoiceUrl?: string } | undefined;
  if (payment.company_id) {
    const link = await getFiscalLinkByPayment(payment.id, payment.company_id).catch(() => null);
    if (link) {
      fiscalDocument = {
        provider: link.provider,
        invoiceNumber: link.invoice_number,
        ...(link.invoice_url ? { invoiceUrl: link.invoice_url } : {}),
      };
    }
  }

  const receipt = {
    companyName: payment.payer_name || COMPANY.name,
    companyCnpj: payment.payer_cnpj || COMPANY.cnpj,
    workerName: payment.worker_name,
    workerAddress: payment.worker_address,
    reference: payment.reference,
    range: { min: payment.range_min / 100, max: payment.range_max / 100 },
    proofId: payment.proof_id,
    txHash: payment.tx_hash,
    explorerUrl: `${EXPLORER_BASE}/tx/${payment.tx_hash}`,
    issuedAt: payment.created_at,
    ...(fiscalDocument ? { fiscalDocument } : {}),
  };

  // Machine-readable variant. The exact amount is never disclosed on this path
  // (no viewing key here), so viewKeyDisclosed is false and the figure is absent.
  if (req.nextUrl.searchParams.get('format') === 'json') {
    return NextResponse.json(receiptJson({ ...receipt, viewKeyDisclosed: false }));
  }

  const pdf = await generateReceiptPdf(receipt);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="shieldpay-proof-${payment.reference}-${id}.pdf"`,
    },
  });
}
