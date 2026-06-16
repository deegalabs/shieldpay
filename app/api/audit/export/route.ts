import { NextRequest, NextResponse } from 'next/server';
import { listPayments } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/audit/export?token=...
 * Fiscal CSV export for an auditor. Read-only; exact amounts are not included
 * (only the public proven range), preserving the privacy guarantee.
 */
export async function GET(_req: NextRequest) {
  let payments;
  try {
    payments = await listPayments(1000);
  } catch (e) {
    return NextResponse.json({ error: 'database unavailable', detail: String(e) }, { status: 503 });
  }

  const header = [
    'date',
    'contractor',
    'reference',
    'range_min_usdc',
    'range_max_usdc',
    'proof_id',
    'tx_hash',
    'verified',
    'explorer_url',
  ].join(',');

  const rows = payments.map((p) =>
    [
      new Date(p.created_at).toISOString(),
      `"${p.worker_name.replace(/"/g, '""')}"`,
      p.reference,
      p.range_min / 100,
      p.range_max / 100,
      p.proof_id,
      p.tx_hash,
      p.verified,
      `${EXPLORER_BASE}/tx/${p.tx_hash}`,
    ].join(','),
  );

  const csv = [header, ...rows].join('\n');
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="shieldpay-audit.csv"',
    },
  });
}
