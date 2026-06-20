import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCompany } from '@/lib/auth/server';
import { createInvite } from '@/lib/db/client';
import { signScopedToken } from '@/lib/auth/session';

export const runtime = 'nodejs';

function origin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : req.nextUrl.origin;
}

const Body = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  role: z.string().optional(),
  minUsdc: z.number().nonnegative(),
  maxUsdc: z.number().positive(),
});

/** POST /api/contractors/invite — company creates an invite + returns the link. */
export async function POST(req: NextRequest) {
  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  const company = auth.company;

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { name, email, role, minUsdc, maxUsdc } = parsed.data;

  const contractor = await createInvite({
    company_id: company.id,
    name,
    email: email ?? null,
    role: role ?? null,
    range_min: Math.round(minUsdc * 100),
    range_max: Math.round(maxUsdc * 100),
  });

  const token = await signScopedToken({ scope: 'invite', cid: contractor.id }, '30d');
  return NextResponse.json({ ok: true, url: `${origin(req)}/invite/${token}`, contractor });
}
