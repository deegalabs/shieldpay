/**
 * Seed ONE honest end-to-end demo record into the live database, so the company
 * demo dashboard shows a real verified payment instead of an empty state.
 *
 * Everything is real on-chain: a worker keypair is funded, given a USDC
 * trustline, and anchored in AnchorRegistry; then a payroll line runs through
 * the same proveAndRecordPayment used in production (Groth16 proof verified in
 * the PaymentVerifier, settlement over USDC, witness sealed under the viewing
 * key). No mock "verified" rows.
 *
 * Run with the production environment injected (secrets never printed):
 *   railway run -- pnpm tsx scripts/seed_demo.ts
 */
import {
  Keypair,
  Asset,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import {
  upsertCompany,
  createContractor,
  setInviteAnchored,
  ensureCompanyViewingKey,
  createPayrollRun,
  finalizePayrollRun,
  listContractors,
} from '@/lib/db/client';
import { proveAndRecordPayment, recordRunAggregateProof } from '@/lib/payments/flow';
import { ServerSigner } from '@/lib/stellar/signer';
import { submitTwoPartyAnchor, companyKeypairSigner } from '@/lib/stellar/anchor-cosign';
import {
  generateKeypair,
  fundTestnetAccount,
  horizonServer,
  networkPassphrase,
} from '@/lib/stellar/client';
import { hashCpf } from '@/lib/stellar/auth';
import { CONTRACTS, USDC, COMPANY, DEMO_COMPANY_SUB } from '@/lib/constants';

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing ${name} (run with: railway run -- pnpm tsx scripts/seed_demo.ts)`);
  return v;
}

async function openUsdcTrustline(secret: string): Promise<void> {
  const kp = Keypair.fromSecret(secret);
  const account = await horizonServer.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(Operation.changeTrust({ asset: new Asset(USDC.code, USDC.issuer) }))
    .setTimeout(120)
    .build();
  tx.sign(kp);
  await horizonServer.submitTransaction(tx);
}

/**
 * Anchor the worker identity on-chain with the co-signed payment range (M2). The
 * seed holds both keys, so it produces the worker's envelope signature (the
 * worker is the tx source) AND the company's Soroban authorization entry
 * (`anchor_with_range` now require_auth's both). If the deployed registry still
 * predates M2, `submitTwoPartyAnchor` falls back to a single-party anchor, so the
 * demo critical path keeps working across the redeploy boundary.
 */
async function anchorOnChain(
  workerSecret: string,
  companySecret: string,
  companyAddress: string,
  cpfHash: string,
  rangeMinCents: number,
  rangeMaxCents: number,
): Promise<string> {
  const workerKeypair = Keypair.fromSecret(workerSecret);
  const companyKeypair = Keypair.fromSecret(companySecret);
  const { hash, cosigned } = await submitTwoPartyAnchor({
    params: {
      anchorContractId: CONTRACTS.anchorRegistry,
      workerAddress: workerKeypair.publicKey(),
      companyAddress,
      cpfHash,
      rangeMinCents,
      rangeMaxCents,
    },
    workerKeypair,
    companySign: companyKeypairSigner(companyKeypair),
  });
  console.log(`  anchor ${cosigned ? 'co-signed by company (M2)' : 'single-party (pre-M2 registry)'}`);
  return hash;
}

async function main() {
  // Gated one-shot: only runs when explicitly asked (e.g. a Railway pre-deploy
  // hook with SEED_DEMO=1), so normal deploys never reseed.
  if (process.env.SEED_DEMO !== '1') {
    console.log('seed_demo: SEED_DEMO != 1, skipping.');
    return;
  }

  const companySecret = need('COMPANY_SECRET_KEY');
  const companyAddress = need('COMPANY_PUBLIC_KEY');
  need('ANCHOR_REGISTRY_CONTRACT_ID');
  need('PAYMENT_VERIFIER_CONTRACT_ID');
  need('DATABASE_URL');

  console.log('1/6 upserting demo company...');
  // Owned by the isolated demo identity (A4), never the treasury key; the real
  // funded treasury address is kept for on-chain settlement.
  const company = await upsertCompany({
    owner_sub: DEMO_COMPANY_SUB,
    name: COMPANY.name,
    cnpj: COMPANY.cnpj,
    treasury_address: companyAddress,
    type: 'dao',
  });

  // Idempotent: if this company already has a contractor, assume seeded.
  const existing = await listContractors(company.id);
  if (existing.length > 0) {
    console.log(`seed_demo: already seeded (${existing.length} contractor(s)), skipping.`);
    return;
  }

  console.log('2/6 creating + funding a worker wallet...');
  const worker = generateKeypair();
  await fundTestnetAccount(worker.publicKey);

  console.log('3/6 opening the worker USDC trustline...');
  await openUsdcTrustline(worker.secret);

  const cpfHash = hashCpf('123.456.789-00');
  console.log('4/6 anchoring the worker identity on-chain...');
  const anchorTx = await anchorOnChain(worker.secret, companySecret, companyAddress, cpfHash, 45000, 55000);

  const contractor = await createContractor({
    company_id: company.id,
    name: 'Jane Doe',
    cpf_hash: cpfHash,
    stellar_address: worker.publicKey,
    range_min: 45000,
    range_max: 55000,
  });
  await setInviteAnchored(contractor.id, anchorTx);

  console.log('5/6 running a real payroll line (prove + record + settle)...');
  const viewingKey = await ensureCompanyViewingKey(company.id);
  const run = await createPayrollRun(company.id, 'JUN2026');
  const result = await proveAndRecordPayment({
    companySecret,
    company,
    input: {
      workerName: 'Jane Doe',
      workerAddress: worker.publicKey,
      amountUsdc: 500,
      minUsdc: 450,
      maxUsdc: 550,
      reference: 'JUN2026',
    },
    runId: run.id,
    viewingKey,
  });
  await finalizePayrollRun(run.id, result.amountCents, 1);

  // Prove the whole run at once (aggregate Proof-of-Payroll), so the demo run
  // shows the total proven on-chain with no salary revealed.
  const agg = await recordRunAggregateProof({
    signer: new ServerSigner(companySecret),
    runId: run.id,
    reference: 'JUN2026',
    results: [result],
  });
  console.log(`  payroll proof: ${agg ? `#${agg.proofId}, tx ${agg.txHash.slice(0, 10)}...` : 'skipped'}`);

  console.log('6/6 done.');
  console.log(`  company: ${company.name} (${company.id})`);
  console.log(`  worker:  ${worker.publicKey} (anchored, tx ${anchorTx.slice(0, 10)}...)`);
  console.log(`  payment: proof #${result.proofId}, record tx ${result.txHash.slice(0, 10)}...`);
  console.log(`  settled: ${result.settlementTxHash ? result.settlementTxHash.slice(0, 10) + '...' : 'skipped'}`);
  process.exit(0);
}

main().catch((e) => {
  // Never fail the deploy on a seed error; the message is in the deploy logs.
  console.error('seed_demo error:', e instanceof Error ? e.message : e);
  process.exit(0);
});
