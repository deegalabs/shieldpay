/**
 * Compliance / KYC gate (E2, base only).
 *
 * This is the BASE hook that runs before a payment is proved or recorded. The
 * default decision is anchor-based ONLY: a recipient address that is anchored
 * for the paying company is allowed, anything else is denied. No external
 * sanctions or KYC provider is wired here. Do not read this as real KYC or
 * sanctions screening: it reuses the existing on-chain identity anchor as a
 * stand-in gate so the app enforces a real rule today.
 *
 * The production path moves this gate on-chain: it becomes an `is_allowed` call
 * inside the E1 escrow contract, checked before USDC is released (see
 * docs/ROADMAP.md, sections E2 and E1). Until that redeploy lands, the app-side
 * gate and this interface are the enforcement point.
 *
 * Seam for a real provider: `getComplianceCheck()` returns the default today.
 * When a provider is chosen, select it here (for example by an env var such as
 * COMPLIANCE_PROVIDER) and return a `ComplianceCheck` that calls it, keeping the
 * same interface so callers do not change.
 */

import type { ComplianceContext, ComplianceDecision, ComplianceCheck } from './types';

export type { ComplianceContext, ComplianceDecision, ComplianceCheck } from './types';

/**
 * Thrown when a payment is denied by the compliance gate. The API boundary maps
 * this to HTTP 422 (business-rule rejection). The `reason` is a generic,
 * non-leaky message safe to surface to the caller.
 */
export class ComplianceError extends Error {
  readonly provider: string;
  constructor(reason: string, provider: string) {
    super(reason);
    this.name = 'ComplianceError';
    this.provider = provider;
  }
}

/** Read the anchored flag from the contractors table for this company. */
async function defaultIsAnchored(companyId: string | number, workerAddress: string): Promise<boolean> {
  const { listContractorsByAddress } = await import('@/lib/db/client');
  const rows = await listContractorsByAddress(workerAddress);
  const company = String(companyId);
  return rows.some((r) => r.anchored && String(r.company_id) === company);
}

/**
 * Default gate: allow the payment when the recipient address is anchored for the
 * paying company, otherwise deny. The anchor lookup is injectable so tests can
 * stub it without a database. This is not KYC or sanctions screening: it is the
 * existing identity anchor reused as the base compliance decision.
 */
export class DefaultAnchorCompliance implements ComplianceCheck {
  readonly provider = 'anchor-default';
  private readonly isAnchored: (companyId: string | number, workerAddress: string) => Promise<boolean>;

  constructor(
    isAnchored: (companyId: string | number, workerAddress: string) => Promise<boolean> = defaultIsAnchored,
  ) {
    this.isAnchored = isAnchored;
  }

  async check(ctx: ComplianceContext): Promise<ComplianceDecision> {
    const anchored = await this.isAnchored(ctx.companyId, ctx.workerAddress);
    if (anchored) {
      return { allowed: true, provider: this.provider };
    }
    return {
      allowed: false,
      reason: 'recipient identity is not anchored for this company',
      provider: this.provider,
    };
  }
}

/**
 * Factory for the active compliance gate. Returns the anchor-based default today.
 * This is the single seam to swap in an env-selected real provider later, with no
 * change to callers.
 */
export function getComplianceCheck(): ComplianceCheck {
  return new DefaultAnchorCompliance();
}

/**
 * Run the gate and throw a `ComplianceError` when the payment is denied. Callers
 * in the payment path use this so a denial surfaces as a typed error that the API
 * boundary maps to HTTP 422.
 */
export async function assertCompliant(
  check: ComplianceCheck,
  ctx: ComplianceContext,
): Promise<ComplianceDecision> {
  const decision = await check.check(ctx);
  if (!decision.allowed) {
    throw new ComplianceError(
      decision.reason ?? 'payment not allowed by compliance policy',
      decision.provider,
    );
  }
  return decision;
}
