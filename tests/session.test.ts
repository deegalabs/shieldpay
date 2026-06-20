import { describe, it, expect, beforeAll } from 'vitest';
import { signSession, verifySession, signScopedToken, verifyScopedToken } from '@/lib/auth/session';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

describe('session JWT', () => {
  it('round-trips a session', async () => {
    const token = await signSession({ sub: 'GWORKER1', role: 'worker', name: 'Jane', method: 'demo' });
    const s = await verifySession(token);
    expect(s).not.toBeNull();
    expect(s!.sub).toBe('GWORKER1');
    expect(s!.role).toBe('worker');
    expect(s!.name).toBe('Jane');
  });

  it('rejects a missing token', async () => {
    expect(await verifySession(undefined)).toBeNull();
  });

  it('rejects a tampered token', async () => {
    const token = await signSession({ sub: 'GCOMPANY', role: 'company' });
    const tampered = token.slice(0, -3) + (token.endsWith('aaa') ? 'bbb' : 'aaa');
    expect(await verifySession(tampered)).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    process.env.JWT_SECRET = 'secret-a';
    const token = await signSession({ sub: 'GCOMPANY', role: 'company' });
    process.env.JWT_SECRET = 'secret-b';
    expect(await verifySession(token)).toBeNull();
    process.env.JWT_SECRET = 'test-secret';
  });
});

describe('scoped audit token', () => {
  it('round-trips claims', async () => {
    const token = await signScopedToken({ scope: 'audit', companyId: '42', disclose: true }, '30d');
    const claims = await verifyScopedToken<{ scope: string; companyId: string; disclose: boolean }>(token);
    expect(claims).not.toBeNull();
    expect(claims!.scope).toBe('audit');
    expect(claims!.companyId).toBe('42');
    expect(claims!.disclose).toBe(true);
  });

  it('rejects an expired token', async () => {
    const token = await signScopedToken({ scope: 'audit' }, '0s');
    // exp is now; allow a moment to pass the boundary
    await new Promise((r) => setTimeout(r, 1100));
    expect(await verifyScopedToken(token)).toBeNull();
  });
});
