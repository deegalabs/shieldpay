import { describe, it, expect, afterEach, vi } from 'vitest';
import { rateLimit, clientIp } from '@/lib/rate-limit';

afterEach(() => {
  vi.useRealTimers();
});

describe('rateLimit', () => {
  it('allows up to the limit, then blocks', () => {
    const key = `t1:${Math.random()}`;
    expect(rateLimit(key, 3, 60000).ok).toBe(true);
    expect(rateLimit(key, 3, 60000).ok).toBe(true);
    expect(rateLimit(key, 3, 60000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('resets after the window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const key = `t2:${Math.random()}`;
    expect(rateLimit(key, 1, 1000).ok).toBe(true);
    expect(rateLimit(key, 1, 1000).ok).toBe(false);
    vi.setSystemTime(2_500); // past the 1s window
    expect(rateLimit(key, 1, 1000).ok).toBe(true);
  });

  it('keeps separate counters per key', () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    expect(rateLimit(a, 1, 60000).ok).toBe(true);
    expect(rateLimit(a, 1, 60000).ok).toBe(false);
    expect(rateLimit(b, 1, 60000).ok).toBe(true);
  });
});

describe('clientIp', () => {
  it('uses the first x-forwarded-for hop', () => {
    const req = new Request('https://x/', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } });
    expect(clientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to unknown', () => {
    expect(clientIp(new Request('https://x/'))).toBe('unknown');
  });
});
