import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCompany } from '@/lib/auth/server';
import { getContractor, updateContractor, deleteContractor } from '@/lib/db/client';
import { toContractorDTO } from '@/lib/db/dto';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  try {
    const contractor = await getContractor(params.id, auth.company.id);
    if (!contractor) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ contractor: toContractorDTO(contractor) });
  } catch (e) {
    console.error('contractor GET failed', e);
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
}

const Patch = z.object({
  name: z.string().min(2),
  stellar_address: z.string().startsWith('G'),
  minUsdc: z.number().nonnegative(),
  maxUsdc: z.number().positive(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  const parsed = Patch.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { name, stellar_address, minUsdc, maxUsdc } = parsed.data;
  try {
    const updated = await updateContractor(params.id, auth.company.id, {
      name,
      stellar_address,
      range_min: Math.round(minUsdc * 100),
      range_max: Math.round(maxUsdc * 100),
    });
    if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true, contractor: toContractorDTO(updated) });
  } catch (e) {
    console.error('contractor PATCH failed', e);
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  try {
    await deleteContractor(params.id, auth.company.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('contractor DELETE failed', e);
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
}
