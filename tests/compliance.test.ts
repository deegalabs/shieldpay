import { describe, it, expect, vi } from 'vitest';
import {
  DefaultAnchorCompliance,
  ComplianceError,
  assertCompliant,
  getComplianceCheck,
  type ComplianceContext,
} from '@/lib/compliance';

const ctx: ComplianceContext = {
  companyId: 'company-1',
  workerAddress: 'GWORKER1',
  amountCents: 50000,
  reference: 'MAY2026',
};

describe('DefaultAnchorCompliance', () => {
  it('allows an anchored recipient', async () => {
    const check = new DefaultAnchorCompliance(async () => true);
    const decision = await check.check(ctx);
    expect(decision.allowed).toBe(true);
    expect(decision.provider).toBe('anchor-default');
    expect(decision.reason).toBeUndefined();
  });

  it('denies a non-anchored recipient with a clear, non-leaky reason', async () => {
    const check = new DefaultAnchorCompliance(async () => false);
    const decision = await check.check(ctx);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('recipient identity is not anchored for this company');
    expect(decision.provider).toBe('anchor-default');
  });

  it('consults the injected isAnchored with the company and address', async () => {
    const isAnchored = vi.fn(async () => true);
    const check = new DefaultAnchorCompliance(isAnchored);
    await check.check(ctx);
    expect(isAnchored).toHaveBeenCalledTimes(1);
    expect(isAnchored).toHaveBeenCalledWith('company-1', 'GWORKER1');
  });
});

describe('assertCompliant', () => {
  it('returns the decision when allowed', async () => {
    const check = new DefaultAnchorCompliance(async () => true);
    const decision = await assertCompliant(check, ctx);
    expect(decision.allowed).toBe(true);
  });

  it('throws a typed ComplianceError when denied', async () => {
    const check = new DefaultAnchorCompliance(async () => false);
    await expect(assertCompliant(check, ctx)).rejects.toBeInstanceOf(ComplianceError);
    await expect(assertCompliant(check, ctx)).rejects.toThrow(
      'recipient identity is not anchored for this company',
    );
  });

  it('carries the provider on the thrown error', async () => {
    const check = new DefaultAnchorCompliance(async () => false);
    try {
      await assertCompliant(check, ctx);
      throw new Error('expected a rejection');
    } catch (e) {
      expect(e).toBeInstanceOf(ComplianceError);
      expect((e as ComplianceError).provider).toBe('anchor-default');
    }
  });
});

describe('getComplianceCheck', () => {
  it('returns the anchor-based default gate', () => {
    const check = getComplianceCheck();
    expect(check).toBeInstanceOf(DefaultAnchorCompliance);
  });
});
