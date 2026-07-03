import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, rateLimited } from '@/lib/auth/server';
import {
  getPayment,
  getCompanyByOwner,
  createFiscalLink,
  getFiscalLinkByPayment,
  type PaymentRow,
  type CompanyRow,
} from '@/lib/db/client';
import { getNfseAdapter } from '@/lib/fiscal/adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/fiscal, link a recorded payment to a fiscal document (nota fiscal /
 * NFS-e). GET /api/fiscal?paymentId=<id>, read the link for a payment.
 *
 * MOCK-BACKED: the fiscal document is produced by lib/fiscal/adapter.ts
 * (MockNfseAdapter), NOT by a real municipal NFS-e web service. See docs/ROADMAP.md
 * (F3). Access is restricted to the company session that owns the payment.
 */

const Body = z.object({
  paymentId: z.union([z.string().min(1), z.number().int().positive()]),
  description: z.string().max(500).optional(),
});

/**
 * Resolve the payment and confirm the current company session owns it. Returns
 * the payment + company on success, or the HTTP response to return otherwise
 * (401 no session, 403 wrong role, 404 not found / not owned, 503 db down).
 */
async function requirePaymentOwner(
  paymentId: string,
): Promise<
  | { ok: true; payment: PaymentRow; company: CompanyRow }
  | { ok: false; res: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: 'sign in required' }, { status: 401 }) };
  }
  if (session.role !== 'company') {
    return { ok: false, res: NextResponse.json({ error: 'company session required' }, { status: 403 }) };
  }
  let payment: PaymentRow | null;
  let company: CompanyRow | null;
  try {
    payment = await getPayment(paymentId);
    company = await getCompanyByOwner(session.sub);
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'database unavailable' }, { status: 503 }) };
  }
  if (!company) {
    return { ok: false, res: NextResponse.json({ error: 'company not found' }, { status: 404 }) };
  }
  if (!payment || String(payment.company_id) !== String(company.id)) {
    return { ok: false, res: NextResponse.json({ error: 'not found' }, { status: 404 }) };
  }
  return { ok: true, payment, company };
}

export async function POST(req: NextRequest) {
  const limited = rateLimited(req, 'fiscal-link', 20, 60_000);
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
  const paymentId = String(parsed.data.paymentId);

  const owned = await requirePaymentOwner(paymentId);
  if (!owned.ok) return owned.res;
  const { payment, company } = owned;

  try {
    const recipient = payment.worker_name || payment.worker_address;
    const description =
      parsed.data.description || `Services rendered, reference ${payment.reference}`;
    const doc = await getNfseAdapter().issue({
      reference: payment.reference,
      recipient,
      description,
    });

    const link = await createFiscalLink({
      payment_id: payment.id,
      company_id: company.id,
      provider: doc.provider,
      invoice_number: doc.invoiceNumber,
      invoice_series: doc.invoiceSeries ?? null,
      invoice_url: doc.invoiceUrl ?? null,
      status: doc.status,
      amount_cents: null,
      external_id: doc.externalId,
      issued_at: doc.issuedAt,
    });

    // Honest about the mock: the client should surface this, not claim a real NFS-e.
    return NextResponse.json({ link, mock: true });
  } catch (e) {
    console.error('fiscal link failed', e);
    return NextResponse.json({ error: 'could not link fiscal document' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('paymentId');
  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId query param required' }, { status: 400 });
  }

  const owned = await requirePaymentOwner(paymentId);
  if (!owned.ok) return owned.res;

  try {
    const link = await getFiscalLinkByPayment(owned.payment.id, owned.company.id);
    if (!link) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ link, mock: true });
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
}
