import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, rateLimited } from '@/lib/auth/server';
import { getCompanyByOwner } from '@/lib/db/client';
import { issueIncomeCredential, IncomeIssueError } from '@/lib/income/issue';
import {
  generateIncomeStatementPdf,
  incomeStatementJson,
  type IncomeStatementData,
} from '@/lib/pdf/income-statement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const Body = z.object({
  workerAddress: z.string().min(1),
  rangeMinCents: z.number().int().nonnegative(),
  rangeMaxCents: z.number().int().positive(),
  periodLabel: z.string().min(1).max(80),
});

/** Absolute origin of the request, for the QR verify link. */
function origin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : req.nextUrl.origin;
}

/** Map a coded issuance failure to a generic HTTP response (no figure leak). */
function errorResponse(e: IncomeIssueError): NextResponse {
  switch (e.code) {
    case 'company_not_found':
      return NextResponse.json({ error: 'company not found' }, { status: 404 });
    case 'db_unavailable':
      return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
    case 'insufficient_payments':
      return NextResponse.json(
        { error: 'not enough recorded payments to this recipient to issue a proof of income' },
        { status: 422 },
      );
    case 'unseal_failed':
      return NextResponse.json(
        { error: 'a recorded payment could not be read for issuance' },
        { status: 422 },
      );
    case 'total_outside_range':
      return NextResponse.json(
        { error: 'the selected payments do not total within the range provided' },
        { status: 422 },
      );
    case 'issuer_not_configured':
      return NextResponse.json({ error: 'issuer not configured' }, { status: 500 });
  }
}

/**
 * POST /api/income/statement — issue a proof of income and return it as a formal,
 * downloadable statement (PDF). Reuses the F1 issuance core: it mints and records
 * an on-chain income credential, then renders a plain-language document a bank,
 * consulate, or tax office can read. The exact amounts are never disclosed.
 *
 * `?format=json` returns the same facts as `incomeStatementJson`, behind the same
 * company auth. This route never returns any amount, the employer key, the
 * nullifier secret, or any randomness.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimited(req, 'income-statement', 10, 60_000);
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  const { workerAddress, rangeMinCents, rangeMaxCents, periodLabel } = parsed.data;
  if (rangeMinCents > rangeMaxCents) {
    return NextResponse.json({ error: 'invalid range' }, { status: 400 });
  }

  // auth -> authz
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  if (session.role !== 'company') {
    return NextResponse.json({ error: 'company session required' }, { status: 403 });
  }

  if (!process.env.COMPANY_SECRET_KEY) {
    return NextResponse.json({ error: 'issuer not configured' }, { status: 500 });
  }

  try {
    const company = await getCompanyByOwner(session.sub);
    if (!company) return NextResponse.json({ error: 'company not found' }, { status: 404 });

    // The period scopes both the document and the credential's nullifier.
    const verifierLabel = `INCOME-STATEMENT|${periodLabel}`;

    const result = await issueIncomeCredential({
      companyId: company.id,
      workerAddress,
      rangeMinCents,
      rangeMaxCents,
      verifierLabel,
    });

    const verifyUrl = `${origin(req)}/verify-income?n=${result.nullifier}&id=${result.credentialId}`;
    const data: IncomeStatementData = {
      companyName: result.companyName,
      companyCnpj: result.companyCnpj,
      workerName: result.workerName,
      workerAddress,
      periodLabel,
      range: { min: result.rangeMinCents / 100, max: result.rangeMaxCents / 100 },
      employerAx: result.employerAx,
      credentialId: result.credentialId,
      txHash: result.txHash,
      verifyUrl,
      issuedAt: new Date().toISOString(),
    };

    if (req.nextUrl.searchParams.get('format') === 'json') {
      return NextResponse.json(incomeStatementJson(data));
    }

    const pdf = await generateIncomeStatementPdf(data);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="shieldpay-income-statement.pdf"',
      },
    });
  } catch (e) {
    if (e instanceof IncomeIssueError) return errorResponse(e);
    console.error('income statement failed', e);
    return NextResponse.json({ error: 'could not issue proof of income' }, { status: 500 });
  }
}
