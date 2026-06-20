import { SignJWT, jwtVerify } from 'jose';

/**
 * Session layer — signed JWT in an httpOnly cookie. Edge-safe (jose / WebCrypto)
 * so it can be verified inside Next middleware. MVP: identity is the Stellar
 * address (wallet auth) or a method-specific handle; no heavy user table.
 */

export type Role = 'company' | 'worker' | 'auditor';

export interface Session {
  sub: string; // stellar address, passkey handle, or email
  role: Role;
  name?: string;
  method?: 'demo' | 'wallet' | 'passkey' | 'magic' | 'privy';
}

export const SESSION_COOKIE = 'shieldpay_session';

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (s) return new TextEncoder().encode(s);
  // Fail closed in production: never fall back to a known default secret.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode('dev-secret-change-me');
}

export async function signSession(s: Session, expires = '24h'): Promise<string> {
  return new SignJWT({ role: s.role, name: s.name, method: s.method })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: String(payload.sub ?? ''),
      role: payload.role as Role,
      name: payload.name as string | undefined,
      method: payload.method as Session['method'],
    };
  } catch {
    return null;
  }
}

/** Claims carried by an auditor link. The viewing key is never put in the token. */
export interface AuditTokenClaims {
  scope: 'audit';
  companyId?: string;
  disclose?: boolean;
}

/** Sign a short-lived, scoped token (auditor link / magic link). */
export async function signScopedToken(
  claims: Record<string, unknown>,
  expires: string,
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret());
}

export async function verifyScopedToken<T = Record<string, unknown>>(
  token: string,
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as T;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24, // 24h
};
