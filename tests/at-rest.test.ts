import { describe, it, expect, afterEach } from 'vitest';
import { encryptAtRest, decryptAtRest } from '@/lib/crypto/at-rest';

afterEach(() => {
  delete process.env.VIEWING_KEY_ENC_KEY;
});

describe('at-rest encryption', () => {
  it('is a no-op when no master key is set (backward compatible)', () => {
    delete process.env.VIEWING_KEY_ENC_KEY;
    const v = 'a3f2b1c4d5e6';
    expect(encryptAtRest(v)).toBe(v);
    expect(decryptAtRest(v)).toBe(v);
  });

  it('round-trips when a master key is set', () => {
    process.env.VIEWING_KEY_ENC_KEY = 'super-secret-master-key';
    const v = '129ead17ce37e5926d30897daea54f75';
    const enc = encryptAtRest(v);
    expect(enc).not.toBe(v);
    expect(enc.startsWith('enc:v1:')).toBe(true);
    expect(decryptAtRest(enc)).toBe(v);
  });

  it('still reads legacy plaintext when a master key is set', () => {
    process.env.VIEWING_KEY_ENC_KEY = 'super-secret-master-key';
    expect(decryptAtRest('legacy-plaintext-key')).toBe('legacy-plaintext-key');
  });

  it('fails to decrypt with the wrong master key', () => {
    process.env.VIEWING_KEY_ENC_KEY = 'key-a';
    const enc = encryptAtRest('secret');
    process.env.VIEWING_KEY_ENC_KEY = 'key-b';
    expect(() => decryptAtRest(enc)).toThrow();
  });
});
