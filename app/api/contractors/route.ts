import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, listContractors, createContractor } from '@/lib/db/client';
import { hashCpf } from '@/lib/stellar/auth';

export const runtime = 'nodejs';

async function company() {
  const session = await getSession();
  if (!session || session.role !== 'company') return null;
  return getCompanyByOwner(session.sub);
}

export async function GET() {
  try {
    const c = await company();
    if (!c) return NextResponse.json({ error: 'company session required' }, { status: 403 });
    return NextResponse.json({ contractors: await listContractors(c.id) });
  } catch (e) {
    console.error('contractors GET failed', e);
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
}

const Body = z.object({
  name: z.string().min(2),
  cpf: z.string().optional(),
  stellar_address: z.string().startsWith('G'),
  minUsdc: z.number().nonnegative(),
  maxUsdc: z.number().positive(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const c = await company();
    if (!c) return NextResponse.json({ error: 'company session required' }, { status: 403 });
    const { name, cpf, stellar_address, minUsdc, maxUsdc } = parsed.data;
    const contractor = await createContractor({
      company_id: c.id,
      name,
      cpf_hash: cpf ? hashCpf(cpf) : null,
      stellar_address,
      range_min: Math.round(minUsdc * 100),
      range_max: Math.round(maxUsdc * 100),
    });
    return NextResponse.json({ ok: true, contractor });
  } catch (e) {
    console.error('contractors POST failed', e);
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
}
