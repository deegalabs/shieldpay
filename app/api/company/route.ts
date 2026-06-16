import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, upsertCompany } from '@/lib/db/client';

export const runtime = 'nodejs';

/** GET /api/company — the caller's company (or null). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const company = await getCompanyByOwner(session.sub);
    return NextResponse.json({ company });
  } catch (e) {
    return NextResponse.json({ error: 'database unavailable', detail: String(e) }, { status: 503 });
  }
}

const Body = z.object({
  name: z.string().min(2),
  cnpj: z.string().optional(),
  treasury_address: z.string().optional(),
});

/** POST /api/company — create/update the caller's company (company role). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'company') {
    return NextResponse.json({ error: 'company session required' }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const company = await upsertCompany({ owner_sub: session.sub, ...parsed.data });
    return NextResponse.json({ ok: true, company });
  } catch (e) {
    return NextResponse.json({ error: 'could not save company', detail: String(e) }, { status: 500 });
  }
}
