import { NextRequest, NextResponse } from 'next/server';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { rpFromRequest, PK_CHALLENGE_COOKIE } from '@/lib/auth/webauthn';
import {
  signSession,
  signScopedToken,
  verifyScopedToken,
  SESSION_COOKIE,
  cookieOptions,
  type Role,
} from '@/lib/auth/session';
import { getCredentialsByHandle, getCredentialById, updateCredentialCounter } from '@/lib/db/client';

export const runtime = 'nodejs';

/** GET: authentication options for a handle (sets challenge cookie). */
export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle') || 'company';
  const { rpID } = rpFromRequest(req);
  const creds = await getCredentialsByHandle(handle);

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: creds.map((c) => ({ id: c.credential_id })),
    userVerification: 'preferred',
  });

  const challengeToken = await signScopedToken({ challenge: options.challenge, handle }, '5m');
  const res = NextResponse.json(options);
  res.cookies.set(PK_CHALLENGE_COOKIE, challengeToken, { ...cookieOptions, maxAge: 300 });
  return res;
}

/** POST: verify the assertion against the stored credential, start a session. */
export async function POST(req: NextRequest) {
  const { rpID, origin } = rpFromRequest(req);
  const body = await req.json().catch(() => null);
  if (!body?.response?.id) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const claims = await verifyScopedToken<{ challenge: string }>(
    req.cookies.get(PK_CHALLENGE_COOKIE)?.value || '',
  );
  if (!claims) return NextResponse.json({ error: 'challenge expired' }, { status: 400 });

  const cred = await getCredentialById(body.response.id);
  if (!cred) return NextResponse.json({ error: 'unknown credential' }, { status: 404 });

  const verification = await verifyAuthenticationResponse({
    response: body.response,
    expectedChallenge: claims.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: cred.credential_id, // base64url string in v10
      credentialPublicKey: new Uint8Array(cred.public_key),
      counter: Number(cred.counter),
    },
  });
  if (!verification.verified) {
    return NextResponse.json({ error: 'authentication not verified' }, { status: 401 });
  }

  await updateCredentialCounter(cred.credential_id, verification.authenticationInfo.newCounter);

  const role = (cred.role as Role) || 'company';
  const token = await signSession({ sub: cred.handle, role, name: cred.handle, method: 'passkey' });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
  res.cookies.set(PK_CHALLENGE_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return res;
}
