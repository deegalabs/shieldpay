import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Keypair } from '@stellar/stellar-sdk';
import { getSession } from '@/lib/auth/server';
import { listContractorsByAddress } from '@/lib/db/client';
import {
  buildCosignedAnchorTx,
  companyKeypairSigner,
  findCompanyAuthEntry,
} from '@/lib/stellar/anchor-cosign';
import { CONTRACTS } from '@/lib/constants';

export const runtime = 'nodejs';

const Body = z.object({
  contractorId: z.union([z.string(), z.number()]),
});

/**
 * POST /api/worker/anchor/company-auth  { contractorId }
 *
 * The M2 identity anchor (`AnchorRegistry.anchor_with_range`) now require_auth's
 * BOTH the worker and the company. The worker is the transaction source and
 * signs the envelope in-browser (their Privy wallet); the company is custodial in
 * the demo, so the server co-signs the company's Soroban authorization entry here
 * and returns the fully assembled, worker-signable transaction.
 *
 * This is NOT a generic signing oracle. Everything the company signs is derived
 * from the caller's own session and the database row, never from the request:
 *   - the worker must own the contract (contractor.stellar_address == session sub),
 *   - the company signed is only ever the server's own company key, and only when
 *     the contract's company treasury is that key,
 *   - the cpf hash and the payment range come from the stored contractor.
 * So the endpoint can only co-sign the exact anchor its own worker is entitled to.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'worker') {
    return NextResponse.json({ error: 'worker session required' }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'contractorId is required' }, { status: 400 });
  }
  const contractorId = String(parsed.data.contractorId);

  const companySecret = process.env.COMPANY_SECRET_KEY;
  if (!companySecret || !CONTRACTS.anchorRegistry) {
    return NextResponse.json({ error: 'company co-signing is not configured' }, { status: 503 });
  }
  const companyKeypair = Keypair.fromSecret(companySecret);
  const companyAddress = companyKeypair.publicKey();

  let contractor;
  try {
    const mine = await listContractorsByAddress(session.sub);
    contractor = mine.find((c) => String(c.id) === contractorId);
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
  if (!contractor || contractor.stellar_address !== session.sub) {
    return NextResponse.json({ error: 'not your contract' }, { status: 403 });
  }
  if (!contractor.cpf_hash) {
    return NextResponse.json({ error: 'contract has no identity hash to anchor' }, { status: 422 });
  }
  // The server only holds the key for its own company. It must not co-sign for a
  // contract whose treasury is some other company's address (e.g. a non-custodial
  // company whose treasury is its own wallet). This is an expected outcome, not an
  // error: reply cosigned=false so the client falls back to the plain self-anchor
  // cleanly, without a console error.
  if (contractor.company_treasury !== companyAddress) {
    return NextResponse.json({ cosigned: false, reason: 'not_custodial' });
  }

  let result;
  try {
    result = await buildCosignedAnchorTx({
      params: {
        anchorContractId: CONTRACTS.anchorRegistry,
        workerAddress: contractor.stellar_address,
        companyAddress,
        cpfHash: contractor.cpf_hash,
        rangeMinCents: contractor.range_min,
        rangeMaxCents: contractor.range_max,
      },
      companySign: companyKeypairSigner(companyKeypair),
    });
  } catch (e) {
    console.error('anchor co-sign failed', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'could not prepare the anchor transaction' }, { status: 502 });
  }

  // The signed company authorization entry (XDR base64), for transparency. The
  // assembled transaction below already carries it plus a matching footprint, so
  // the browser only needs to add the worker's envelope signature and submit.
  const op = result.tx.operations[0];
  const companyEntry =
    op && op.type === 'invokeHostFunction'
      ? findCompanyAuthEntry(op.auth ?? [], companyAddress)
      : null;

  return NextResponse.json({
    cosigned: result.cosigned,
    xdr: result.tx.toXDR(),
    companyAuthEntryXdr: companyEntry ? companyEntry.toXDR('base64') : null,
    validUntilLedgerSeq: result.validUntil,
  });
}
