import { describe, it, expect } from 'vitest';
import { buildPaymentMemo, buildAnchorMemo, MEMO_PREFIX, MEMO_VERSION } from '@/lib/constants';
import { formatUsdc, truncateKey } from '@/lib/utils';

describe('memo protocol', () => {
  it('builds the payment memo', () => {
    const memo = buildPaymentMemo({ contractId: 42, reference: 'JUN2026', proofId: 789 });
    expect(memo).toBe(`${MEMO_PREFIX}|PAY|${MEMO_VERSION}|42|JUN2026|789`);
  });

  it('builds the anchor memo', () => {
    const memo = buildAnchorMemo({ companyAddress: 'GCOMPANY', contractId: 42, cpfHash: 'a3f2' });
    expect(memo).toBe(`${MEMO_PREFIX}|ANCHOR|${MEMO_VERSION}|GCOMPANY|42|a3f2`);
  });
});

describe('utils', () => {
  it('formats USDC with two decimals', () => {
    expect(formatUsdc(500)).toBe('$500.00');
    expect(formatUsdc('1234.5')).toBe('$1,234.50');
  });

  it('truncates long keys and leaves short ones', () => {
    expect(truncateKey('GABCDEFGHIJKLMNOP', 4, 4)).toBe('GABC…MNOP');
    expect(truncateKey('SHORT', 4, 4)).toBe('SHORT');
  });
});
