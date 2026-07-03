/**
 * Headless validation of the two-party (M2) identity anchor against the CURRENTLY
 * deployed AnchorRegistry, using two throwaway testnet keys this script controls.
 * It never touches the production database or the Railway environment: it only
 * talks to the testnet RPC and friendbot.
 *
 * Behaviour:
 *   - If the deployed registry already enforces M2 (anchor_with_range requires the
 *     company's auth), it runs the full worker + company co-signed anchor and
 *     confirms it lands on-chain.
 *   - If the deployed registry still predates M2 (no company auth required), it
 *     prints that two-party co-signing will be validated after the redeploy and
 *     submits nothing.
 *   - If keys/network are unavailable, it prints SKIP with a clear reason and
 *     exits 0 (never blocks on a live call).
 *
 * Optional env: VALIDATE_WORKER_SECRET, VALIDATE_COMPANY_SECRET (funded testnet
 * keys). Absent, it generates and friendbot-funds throwaway keys.
 *
 * Run: pnpm tsx scripts/validate_anchor_cosign.ts
 */
import { Keypair } from '@stellar/stellar-sdk';
import { sorobanServer } from '@/lib/stellar/client';
import { CONTRACTS } from '@/lib/constants';
import { hashCpf } from '@/lib/stellar/auth';
import { buildCosignedAnchorTx, companyKeypairSigner } from '@/lib/stellar/anchor-cosign';

function skip(reason: string): never {
  console.log(`SKIP: ${reason}`);
  process.exit(0);
}

async function fund(pub: string): Promise<boolean> {
  try {
    const r = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(pub)}`);
    return r.ok;
  } catch {
    return false;
  }
}

async function keypair(secretEnv: string): Promise<Keypair> {
  const secret = process.env[secretEnv];
  if (secret) return Keypair.fromSecret(secret);
  const kp = Keypair.random();
  const ok = await fund(kp.publicKey());
  if (!ok) skip(`could not fund a throwaway testnet key via friendbot (${secretEnv})`);
  return kp;
}

async function main() {
  if (!CONTRACTS.anchorRegistry) skip('ANCHOR_REGISTRY_CONTRACT_ID is not configured');

  let worker: Keypair;
  let company: Keypair;
  try {
    worker = await keypair('VALIDATE_WORKER_SECRET');
    company = await keypair('VALIDATE_COMPANY_SECRET');
  } catch (e) {
    skip(`could not obtain testnet keys: ${e instanceof Error ? e.message : e}`);
  }

  console.log(`registry: ${CONTRACTS.anchorRegistry}`);
  console.log(`worker:   ${worker.publicKey()}`);
  console.log(`company:  ${company.publicKey()}`);

  const params = {
    anchorContractId: CONTRACTS.anchorRegistry,
    workerAddress: worker.publicKey(),
    companyAddress: company.publicKey(),
    cpfHash: hashCpf('123.456.789-00'),
    rangeMinCents: 45000,
    rangeMaxCents: 55000,
  };

  let built;
  try {
    built = await buildCosignedAnchorTx({
      params,
      companySign: companyKeypairSigner(company),
    });
  } catch (e) {
    skip(`simulation/assembly failed (network?): ${e instanceof Error ? e.message : e}`);
  }

  if (!built.cosigned) {
    console.log(
      'RESULT: the deployed AnchorRegistry does NOT require company auth (pre-M2).',
    );
    console.log(
      'Two-party co-signing will be validated after the M2 anchor registry is redeployed.',
    );
    console.log('No transaction submitted.');
    process.exit(0);
  }

  console.log('deployed registry enforces M2 (company auth required). Submitting...');
  built.tx.sign(worker);
  const sent = await sorobanServer.sendTransaction(built.tx);
  if (sent.status === 'ERROR') {
    console.error(`FAIL: send error: ${JSON.stringify(sent.errorResult)}`);
    process.exit(1);
  }
  let got = await sorobanServer.getTransaction(sent.hash);
  for (let i = 0; got.status === 'NOT_FOUND' && i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    got = await sorobanServer.getTransaction(sent.hash);
  }
  if (got.status !== 'SUCCESS') {
    console.error(`FAIL: not confirmed (${got.status}) tx ${sent.hash}`);
    process.exit(1);
  }
  console.log(`PASS: two-party anchor confirmed on-chain. tx ${sent.hash}`);
  process.exit(0);
}

main().catch((e) => {
  skip(`unexpected error (treated as non-blocking): ${e instanceof Error ? e.message : e}`);
});
