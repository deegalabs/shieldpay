import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCompany } from '@/lib/auth/server';
import { listContractors, createContractor } from '@/lib/db/client';
import { toContractorDTO, toContractorDTOs } from '@/lib/db/dto';
import { hashCpf } from '@/lib/stellar/auth';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  try {
    return NextResponse.json({ contractors: toContractorDTOs(await listContractors(auth.company.id)) });
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
  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  const { name, cpf, stellar_address, minUsdc, maxUsdc } = parsed.data;
  try {
    const contractor = await createContractor({
      company_id: auth.company.id,
      name,
      cpf_hash: cpf ? hashCpf(cpf) : null,
      stellar_address,
      range_min: Math.round(minUsdc * 100),
      range_max: Math.round(maxUsdc * 100),
    });
    return NextResponse.json({ ok: true, contractor: toContractorDTO(contractor) });
  } catch (e) {
    console.error('contractors POST failed', e);
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
}
