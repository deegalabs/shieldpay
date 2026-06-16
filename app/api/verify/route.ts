import { NextRequest, NextResponse } from 'next/server';
import { CONTRACTS } from '@/lib/constants';

/**
 * GET /api/verify?txHash=...
 * Looks up whether a payment has a recorded, verified ZK proof on-chain
 * (PaymentVerifier.is_verified). Used by the worker/auditor portals and the
 * public receipt verifier.
 */
export async function GET(req: NextRequest) {
  const txHash = req.nextUrl.searchParams.get('txHash');
  if (!txHash) {
    return NextResponse.json({ error: 'txHash query param required' }, { status: 400 });
  }
  if (!CONTRACTS.paymentVerifier) {
    return NextResponse.json(
      { error: 'PAYMENT_VERIFIER_CONTRACT_ID not configured' },
      { status: 503 },
    );
  }

  // TODO: simulate PaymentVerifier.is_verified(txHash) via sorobanServer and
  // return the ProofRecord. Placeholder response keeps the contract shape.
  return NextResponse.json({ txHash, verified: false, pending: true });
}
