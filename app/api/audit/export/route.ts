import { NextRequest, NextResponse } from 'next/server';
import { listPayments, listPaymentsForCompany, type PaymentRow } from '@/lib/db/client';
import { verifyScopedToken } from '@/lib/auth/session';
import { disclosePayments } from '@/lib/payments/disclose';
import { EXPLORER_BASE } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AuditClaims {
  scope: string;
  companyId?: string;
  vk?: string;
  disclose?: boolean;
}

/**
 * Render a CSV cell safely: neutralize spreadsheet formula injection (a leading
 * =, +, -, @, or control char) and quote-escape separators.
 */
function csvCell(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * GET /api/audit/export?token=...
 * Fiscal CSV export for an auditor. Read-only. With a viewing-key link the
 * exact amount (and its on-chain match) is included; otherwise only the public
 * proven range, preserving the privacy guarantee.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const claims = await verifyScopedToken<AuditClaims>(token);
  if (!claims || claims.scope !== 'audit') {
    return NextResponse.json({ error: 'invalid or expired token' }, { status: 401 });
  }

  let payments: PaymentRow[] = [];
  try {
    payments = claims.companyId
      ? await listPaymentsForCompany(claims.companyId, 1000)
      : await listPayments(1000);
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }

  const disclose = Boolean(claims.disclose && claims.vk);
  const disclosed = disclose && claims.vk ? await disclosePayments(claims.vk, payments) : new Map();

  const cols = [
    'date',
    'contractor',
    'reference',
    ...(disclose ? ['amount_usdc', 'matches_on_chain'] : []),
    'range_min_usdc',
    'range_max_usdc',
    'proof_id',
    'tx_hash',
    'verified',
    'explorer_url',
  ];

  const rows = payments.map((p) => {
    const d = disclosed.get(p.id);
    return [
      new Date(p.created_at).toISOString(),
      p.worker_name,
      p.reference,
      ...(disclose
        ? [d && d.amountCents !== null ? d.amountCents / 100 : '', d ? d.matchesOnChain : '']
        : []),
      p.range_min / 100,
      p.range_max / 100,
      p.proof_id,
      p.tx_hash,
      p.verified,
      `${EXPLORER_BASE}/tx/${p.tx_hash}`,
    ]
      .map(csvCell)
      .join(',');
  });

  const csv = [cols.map(csvCell).join(','), ...rows].join('\n');
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="shieldpay-audit.csv"',
    },
  });
}
