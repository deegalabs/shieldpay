/**
 * Types for the compliance / KYC gate (E2). Kept separate from the default
 * implementation so a future provider module can depend on the interface without
 * pulling in the anchor default or the database.
 */

/** Everything the gate needs to decide on a single payment. */
export interface ComplianceContext {
  companyId: string | number;
  workerAddress: string;
  amountCents?: number;
  reference?: string;
}

/** The gate's verdict for one payment. */
export interface ComplianceDecision {
  allowed: boolean;
  reason?: string;
  /** Identifier of the provider that produced the decision (for example 'anchor-default'). */
  provider: string;
}

/** A pluggable compliance gate. Implementations must be side-effect free beyond the check itself. */
export interface ComplianceCheck {
  check(ctx: ComplianceContext): Promise<ComplianceDecision>;
}
