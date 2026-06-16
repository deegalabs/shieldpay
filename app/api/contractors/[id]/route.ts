import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/server';
import {
  getCompanyByOwner,
  getContractor,
  updateContractor,
  deleteContractor,
} from '@/lib/db/client';

export const runtime = 'nodejs';

async function companyId(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== 'company') return null;
  const c = await getCompanyByOwner(session.sub);
  return c?.id ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cid = await companyId();
  if (!cid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const contractor = await getContractor(params.id, cid);
  if (!contractor) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ contractor });
}

const Patch = z.object({
  name: z.string().min(2),
  stellar_address: z.string().startsWith('G'),
  minUsdc: z.number().nonnegative(),
  maxUsdc: z.number().positive(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cid = await companyId();
  if (!cid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const parsed = Patch.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { name, stellar_address, minUsdc, maxUsdc } = parsed.data;
  const updated = await updateContractor(params.id, cid, {
    name,
    stellar_address,
    range_min: Math.round(minUsdc * 100),
    range_max: Math.round(maxUsdc * 100),
  });
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, contractor: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const cid = await companyId();
  if (!cid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await deleteContractor(params.id, cid);
  return NextResponse.json({ ok: true });
}
