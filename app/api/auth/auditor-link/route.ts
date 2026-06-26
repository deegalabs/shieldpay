import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/server';
import { signScopedToken } from '@/lib/auth/session';
import { getCompanyByOwner, ensureCompanyViewingKey } from '@/lib/db/client';

export const runtime = 'nodejs';

const Body = z.object({ days: z.number().optional(), disclose: z.boolean().optional() });

/**
 * POST /api/auth/auditor-link  { days?: number, disclose?: boolean }
 * Company-only. Mints a read-only, expiring auditor link (no wallet needed).
 *
 * - default: read-only — shows the public range + on-chain proofs only.
 * - disclose=true: a "viewing-key" link — also carries the company viewing key,
 *   letting the auditor reveal exact amounts AND re-verify them against the
 *   on-chain commitments (N4). Both link types are scoped to the company.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'company') {
    return NextResponse.json({ error: 'company session required' }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const { days = 30, disclose = false } = parsed.success ? parsed.data : {};
  const clamped = Math.min(Math.max(Number(days) || 30, 1), 365);

  let company = null;
  try {
    company = await getCompanyByOwner(session.sub);
  } catch {
    /* DB unreachable — fall back to an unscoped read-only link */
  }

  const claims: Record<string, unknown> = { scope: 'audit' };
  if (company) claims.companyId = company.id;

  if (disclose) {
    if (!company) {
      return NextResponse.json(
        { error: 'set up your company before issuing a viewing-key link' },
        { status: 400 },
      );
    }
    // Ensure the company has a viewing key, but never put it in the token.
    // It is resolved server-side when the auditor view or export runs.
    await ensureCompanyViewingKey(company.id);
    claims.disclose = true;
    // Stamp the current disclosure epoch so the company can revoke this link
    // (and every other outstanding disclose link) at once by rotating.
    claims.epoch = company.disclose_epoch;
  }

  const token = await signScopedToken(claims, `${clamped}d`);
  return NextResponse.json({
    url: `/audit/${token}`,
    expiresInDays: clamped,
    disclose: Boolean(claims.disclose),
  });
}
