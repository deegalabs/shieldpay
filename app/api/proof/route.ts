import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePaymentProof } from '@/lib/zk/prover';

/**
 * POST /api/proof
 * Generates a Groth16 proof that `value` is within [minValue, maxValue]
 * without revealing it. Requires built circuit artifacts (npm run zk:setup).
 */
const Body = z.object({
  value: z.number().int().nonnegative(),
  valueRandomness: z.string(),
  valueCommitment: z.string(),
  minValue: z.number().int().nonnegative(),
  maxValue: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const proof = await generatePaymentProof(parsed.data);
    return NextResponse.json(proof);
  } catch (e) {
    return NextResponse.json(
      { error: 'proof generation failed — did you run `npm run zk:setup`?', detail: String(e) },
      { status: 500 },
    );
  }
}
