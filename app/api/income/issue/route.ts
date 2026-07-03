import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, rateLimited } from '@/lib/auth/server';
import {
  getCompanyByOwner,
  ensureCompanyViewingKey,
  listPaymentsForWorker,
  type PaymentRow,
} from '@/lib/db/client';
import { openWitness } from '@/lib/zk/disclosure';
import { employerKeyForCompany, signRecord, workerIdFromAddress } from '@/lib/zk/income-signer';
import { generateIncomeCredentialProof, type IncomeRecord } from '@/lib/zk/income';
import { encodeProof, encodePublicSignals, bytesToField } from '@/lib/zk/encode';
import { recordCredentialOnChain } from '@/lib/stellar/soroban';
import { ServerSigner } from '@/lib/stellar/signer';
import { monthFromReference } from '@/lib/payments/reference';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** The income circuit proves exactly N=6 employer-signed monthly records. */
const N = 6;

const Body = z.object({
  workerAddress: z.string().min(1),
  rangeMinCents: z.number().int().nonnegative(),
  rangeMaxCents: z.number().int().positive(),
  verifierLabel: z.string().min(1).max(120),
});

/**
 * POST /api/income/issue — issue a proof of income for a recipient.
 *
 * The company attests, in zero knowledge, that it paid this worker a sum within
 * the claimed range over the last six recorded payments, revealing no monthly
 * amount. The proof is verified and recorded on-chain by the income verifier under
 * a fresh nullifier, so that exact credential cannot be re-recorded. The issuing
 * company can mint further credentials for the same worker, so treat the range and
 * the attesting employer key, not scarcity, as the guarantee. This route never
 * returns any amount, the employer key, the nullifier secret, or any randomness.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimited(req, 'income-issue', 10, 60_000);
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  const { workerAddress, rangeMinCents, rangeMaxCents, verifierLabel } = parsed.data;
  if (rangeMinCents > rangeMaxCents) {
    return NextResponse.json({ error: 'invalid range' }, { status: 400 });
  }

  // auth -> authz
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  if (session.role !== 'company') {
    return NextResponse.json({ error: 'company session required' }, { status: 403 });
  }

  const companySecret = process.env.COMPANY_SECRET_KEY;
  if (!companySecret) {
    return NextResponse.json({ error: 'issuer not configured' }, { status: 500 });
  }

  try {
    const company = await getCompanyByOwner(session.sub);
    if (!company) return NextResponse.json({ error: 'company not found' }, { status: 404 });

    // Most recent N payments to this worker, made by THIS company only.
    let history: PaymentRow[];
    try {
      history = await listPaymentsForWorker(workerAddress);
    } catch {
      return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
    }
    const recent = history.filter((p) => p.company_id === company.id).slice(0, N);
    if (recent.length < N) {
      return NextResponse.json(
        {
          error: `at least ${N} recorded payments to this recipient are required to issue a proof of income`,
        },
        { status: 422 },
      );
    }

    // Unseal each amount with the company viewing key (the same server-held key
    // the auditor export uses). Amounts stay on the server and are never returned.
    const viewingKey = await ensureCompanyViewingKey(company.id);
    const employer = await employerKeyForCompany(viewingKey);
    const workerId = workerIdFromAddress(workerAddress);

    const records: IncomeRecord[] = [];
    let sumCents = 0;
    for (const p of recent) {
      const witness = p.disclosure ? openWitness(viewingKey, p.disclosure) : null;
      if (!witness) {
        return NextResponse.json(
          { error: 'a recorded payment could not be read for issuance' },
          { status: 422 },
        );
      }
      const month = monthFromReference(p.reference);
      const sig = await signRecord(employer.privHex, {
        amountCents: witness.amountCents,
        month,
        workerId,
      });
      records.push({ amountCents: witness.amountCents, month, sig });
      sumCents += witness.amountCents;
    }

    // The claimed range must bracket the true six-month total (the circuit would
    // reject it otherwise). Check here for a clean error that leaks no figure.
    if (sumCents < rangeMinCents || sumCents > rangeMaxCents) {
      return NextResponse.json(
        { error: 'the selected payments do not total within the range provided' },
        { status: 422 },
      );
    }

    // The verifier label scopes the nullifier; a fresh secret keeps each issuance
    // unique so it can be presented once on-chain.
    const verifierId = bytesToField(createHash('sha256').update(verifierLabel).digest());
    const secret = BigInt('0x' + randomBytes(31).toString('hex')).toString();

    const generated = await generateIncomeCredentialProof({
      records,
      employerAx: employer.ax,
      employerAy: employer.ay,
      workerId,
      rangeMinCents,
      rangeMaxCents,
      verifierId,
      secret,
    });

    const { credentialId, txHash } = await recordCredentialOnChain({
      signer: new ServerSigner(companySecret),
      nullifier: generated.nullifier,
      proofBytes: encodeProof(generated.proof),
      publicSignalsBytes: encodePublicSignals(generated.publicSignals),
    });

    return NextResponse.json({
      credentialId,
      nullifier: generated.nullifier.toString('hex'),
      employerAx: employer.ax,
      employerAy: employer.ay,
      rangeMinCents,
      rangeMaxCents,
      verifierLabel,
      txHash,
    });
  } catch (e) {
    console.error('income issuance failed', e);
    return NextResponse.json({ error: 'could not issue proof of income' }, { status: 500 });
  }
}
