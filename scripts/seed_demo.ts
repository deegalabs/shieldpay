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
  Contract,
  Address,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { createHash } from 'node:crypto';
import {
  upsertCompany,
  createContractor,
  setInviteAnchored,
  ensureCompanyViewingKey,
  createPayrollRun,
  finalizePayrollRun,
} from '@/lib/db/client';
import { proveAndRecordPayment } from '@/lib/payments/flow';
import {
  generateKeypair,
  fundTestnetAccount,
  horizonServer,
  sorobanServer,
  networkPassphrase,
} from '@/lib/stellar/client';
import { hashCpf } from '@/lib/stellar/auth';
import { CONTRACTS, USDC, COMPANY } from '@/lib/constants';

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing ${name} (run with: railway run -- pnpm tsx scripts/seed_demo.ts)`);
  return v;
}

async function confirm(server: typeof sorobanServer, hash: string): Promise<void> {
  let got = await server.getTransaction(hash);
  for (let i = 0; got.status === 'NOT_FOUND' && i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    got = await server.getTransaction(hash);
  }
  if (got.status !== 'SUCCESS') throw new Error(`tx ${hash} status ${got.status}`);
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

async function anchorOnChain(secret: string, companyAddress: string, cpfHash: string): Promise<string> {
  const kp = Keypair.fromSecret(secret);
  const addr = kp.publicKey();
  const account = await sorobanServer.getAccount(addr);
  const metadata = `SHIELDPAY|ANCHOR|v1|org:${companyAddress}|cpf:${cpfHash}`;
  const contractHash = createHash('sha256').update(metadata).digest();
  const contract = new Contract(CONTRACTS.anchorRegistry);
  const op = contract.call(
    'anchor',
    new Address(addr).toScVal(),
    new Address(companyAddress).toScVal(),
    nativeToScVal(contractHash, { type: 'bytes' }),
    nativeToScVal(metadata, { type: 'string' }),
  );
  let tx = new TransactionBuilder(account, { fee: '1000000', networkPassphrase })
    .addOperation(op)
    .setTimeout(120)
    .build();
  tx = await sorobanServer.prepareTransaction(tx);
  tx.sign(kp);
  const sent = await sorobanServer.sendTransaction(tx);
  if (sent.status === 'ERROR') throw new Error(`anchor send failed: ${JSON.stringify(sent.errorResult)}`);
  await confirm(sorobanServer, sent.hash);
  return sent.hash;
}

async function main() {
  const companySecret = need('COMPANY_SECRET_KEY');
  const companyAddress = need('COMPANY_PUBLIC_KEY');
  need('ANCHOR_REGISTRY_CONTRACT_ID');
  need('PAYMENT_VERIFIER_CONTRACT_ID');
  need('DATABASE_URL');

  console.log('1/6 upserting demo company...');
  const company = await upsertCompany({
    owner_sub: companyAddress,
    name: COMPANY.name,
    cnpj: COMPANY.cnpj,
    treasury_address: companyAddress,
    type: 'dao',
  });

  console.log('2/6 creating + funding a worker wallet...');
  const worker = generateKeypair();
  await fundTestnetAccount(worker.publicKey);

  console.log('3/6 opening the worker USDC trustline...');
  await openUsdcTrustline(worker.secret);

  const cpfHash = hashCpf('123.456.789-00');
  console.log('4/6 anchoring the worker identity on-chain...');
  const anchorTx = await anchorOnChain(worker.secret, companyAddress, cpfHash);

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

  console.log('6/6 done.');
  console.log(`  company: ${company.name} (${company.id})`);
  console.log(`  worker:  ${worker.publicKey} (anchored, tx ${anchorTx.slice(0, 10)}...)`);
  console.log(`  payment: proof #${result.proofId}, record tx ${result.txHash.slice(0, 10)}...`);
  console.log(`  settled: ${result.settlementTxHash ? result.settlementTxHash.slice(0, 10) + '...' : 'skipped'}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
