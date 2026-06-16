import { NextRequest, NextResponse } from 'next/server';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { rpFromRequest, PK_CHALLENGE_COOKIE, RP_NAME } from '@/lib/auth/webauthn';
import {
  signSession,
  signScopedToken,
  verifyScopedToken,
  SESSION_COOKIE,
  cookieOptions,
} from '@/lib/auth/session';
import { insertCredential } from '@/lib/db/client';

export const runtime = 'nodejs';

/** GET: registration options (sets a short-lived challenge cookie). */
export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle') || 'company';
  const { rpID } = rpFromRequest(req);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: handle,
    userID: new TextEncoder().encode(handle),
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });

  const challengeToken = await signScopedToken({ challenge: options.challenge, handle }, '5m');
  const res = NextResponse.json(options);
  res.cookies.set(PK_CHALLENGE_COOKIE, challengeToken, { ...cookieOptions, maxAge: 300 });
  return res;
}

/** POST: verify the attestation, store the credential, start a session. */
export async function POST(req: NextRequest) {
  const { rpID, origin } = rpFromRequest(req);
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const claims = await verifyScopedToken<{ challenge: string; handle: string }>(
    req.cookies.get(PK_CHALLENGE_COOKIE)?.value || '',
  );
  if (!claims) return NextResponse.json({ error: 'challenge expired' }, { status: 400 });

  const verification = await verifyRegistrationResponse({
    response: body.response,
    expectedChallenge: claims.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'registration not verified' }, { status: 401 });
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
  const role = body.role === 'worker' ? 'worker' : 'company';
  await insertCredential({
    handle: claims.handle,
    credential_id: credentialID, // already a base64url string in v10
    public_key: Buffer.from(credentialPublicKey),
    counter,
    role,
  });

  const token = await signSession({ sub: claims.handle, role, name: claims.handle, method: 'passkey' });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
  res.cookies.set(PK_CHALLENGE_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return res;
}
