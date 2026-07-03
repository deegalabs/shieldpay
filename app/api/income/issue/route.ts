import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, rateLimited } from '@/lib/auth/server';
import { getCompanyByOwner } from '@/lib/db/client';
import {
  issueIncomeCredential,
  IncomeIssueError,
  INCOME_RECORDS,
} from '@/lib/income/issue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const Body = z.object({
  workerAddress: z.string().min(1),
  rangeMinCents: z.number().int().nonnegative(),
  rangeMaxCents: z.number().int().positive(),
  verifierLabel: z.string().min(1).max(120),
});

/**
 * POST /api/income/issue — issue a proof of income for a recipient.
 *
 * The company attests, in zero knowledge, that it paid this worker a sum within
 * the claimed range over the last six recorded payments, revealing no monthly
 * amount. The proof is verified and recorded on-chain by the income verifier under
 * a fresh nullifier, so that exact credential cannot be re-recorded. The issuing
 * company can mint further credentials for the same worker, so treat the range and
 * the attesting employer key, not scarcity, as the guarantee. This route never
 * returns any amount, the employer key, the nullifier secret, or any randomness.
 *
 * The issuance core lives in `lib/income/issue.ts`; this route only handles the
 * HTTP concerns (auth, validation, rate limit, status mapping).
 */
export async function POST(req: NextRequest) {
  const limited = rateLimited(req, 'income-issue', 10, 60_000);
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  const { workerAddress, rangeMinCents, rangeMaxCents, verifierLabel } = parsed.data;
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

    const result = await issueIncomeCredential({
      companyId: company.id,
      workerAddress,
      rangeMinCents,
      rangeMaxCents,
      verifierLabel,
    });

    return NextResponse.json({
      credentialId: result.credentialId,
      nullifier: result.nullifier,
      employerAx: result.employerAx,
      employerAy: result.employerAy,
      rangeMinCents: result.rangeMinCents,
      rangeMaxCents: result.rangeMaxCents,
      verifierLabel: result.verifierLabel,
      txHash: result.txHash,
    });
  } catch (e) {
    if (e instanceof IncomeIssueError) {
      switch (e.code) {
        case 'company_not_found':
          return NextResponse.json({ error: 'company not found' }, { status: 404 });
        case 'db_unavailable':
          return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
        case 'insufficient_payments':
          return NextResponse.json(
            {
              error: `at least ${INCOME_RECORDS} recorded payments to this recipient are required to issue a proof of income`,
            },
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
    console.error('income issuance failed', e);
    return NextResponse.json({ error: 'could not issue proof of income' }, { status: 500 });
  }
}
