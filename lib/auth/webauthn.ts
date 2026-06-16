import type { NextRequest } from 'next/server';

/** Derive the WebAuthn relying-party id + origin from the request host. */
export function rpFromRequest(req: NextRequest): { rpID: string; origin: string } {
  const host =
    req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const rpID = host.split(':')[0] ?? 'localhost';
  const proto =
    req.headers.get('x-forwarded-proto') || (rpID === 'localhost' ? 'http' : 'https');
  return { rpID, origin: `${proto}://${host}` };
}

export const PK_CHALLENGE_COOKIE = 'shieldpay_pk_challenge';
export const RP_NAME = 'ShieldPay';
