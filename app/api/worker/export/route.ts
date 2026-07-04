import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { listPaymentsForWorker, type PaymentRow } from '@/lib/db/client';
import { EXPLORER_BASE } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
 * GET /api/worker/export
 * A CSV of the authenticated worker's received payments for tax filing. The
 * middleware already restricts this to a worker session; we scope to the
 * caller's own address. No exact amount is stored, so the file carries the
 * public agreed range plus the on-chain references (proof tx and settlement
 * tx) where the exact figure can be read on the explorer.
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'worker') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payments: PaymentRow[] = [];
  try {
    payments = await listPaymentsForWorker(session.sub);
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }

  const cols = [
    'date',
    'payer',
    'reference',
    'range_min_usdc',
    'range_max_usdc',
    'verified_on_chain',
    'proof_id',
    'proof_tx',
    'settlement_tx',
    'proof_explorer_url',
    'settlement_explorer_url',
  ];

  const rows = payments.map((p) =>
    [
      new Date(p.created_at).toISOString(),
      p.payer_name ?? '',
      p.reference,
      p.range_min / 100,
      p.range_max / 100,
      p.verified,
      p.proof_id,
      p.tx_hash,
      p.settlement_tx_hash ?? '',
      p.tx_hash ? `${EXPLORER_BASE}/tx/${p.tx_hash}` : '',
      p.settlement_tx_hash ? `${EXPLORER_BASE}/tx/${p.settlement_tx_hash}` : '',
    ]
      .map(csvCell)
      .join(','),
  );

  const csv = [cols.map(csvCell).join(','), ...rows].join('\n');
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="shieldpay-payments.csv"',
    },
  });
}
