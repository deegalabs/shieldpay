import {
  Contract,
  Address,
  Operation,
  TransactionBuilder,
  nativeToScVal,
  authorizeEntry,
  rpc,
  xdr,
  type Keypair,
  type Transaction,
} from '@stellar/stellar-sdk';
import { createHash } from 'node:crypto';
import { sorobanServer, networkPassphrase } from './client';
import { bytesToField, fieldToBe32 } from '@/lib/zk/encode';

/**
 * Two-party identity anchor (M2). `AnchorRegistry.anchor_with_range` now calls
 * both `worker.require_auth()` and `company.require_auth()`, so the anchor
 * transaction needs the company's Soroban authorization entry in addition to the
 * worker's. The worker is the transaction source (self-anchor), so their consent
 * is a source-account credential satisfied by the envelope signature. The
 * company is not the source, so its consent is a separate address-credential auth
 * entry that must be signed with the company key (via `authorizeEntry`).
 *
 * This module builds and assembles that co-signed transaction. It is server-side
 * (the seed and the /api/worker/anchor/company-auth endpoint both use it); the
 * browser path reuses the same assembled transaction XDR the endpoint returns.
 */

const SIM_FEE = '1000000';

/** Structured anchor metadata, identical across seed, endpoint, and browser. */
export function anchorMetadata(companyAddress: string, cpfHash: string): string {
  return `SHIELDPAY|ANCHOR|v1|org:${companyAddress}|cpf:${cpfHash}`;
}

export interface AnchorParams {
  anchorContractId: string;
  workerAddress: string;
  companyAddress: string;
  cpfHash: string;
  rangeMinCents: number;
  rangeMaxCents: number;
}

/**
 * Build the `anchor_with_range` operation. The contract hash and the worker
 * address hash are derived deterministically from the metadata and the worker
 * address, so every party that builds this op with the same params produces the
 * exact same invocation (which is what the company signature commits to).
 */
export function buildAnchorWithRangeOp(p: AnchorParams): xdr.Operation {
  const metadata = anchorMetadata(p.companyAddress, p.cpfHash);
  const contractHash = createHash('sha256').update(metadata).digest();
  // The same worker-address hash the payment circuit exposes as public signal 3.
  const workerAddressHash = fieldToBe32(
    bytesToField(createHash('sha256').update(p.workerAddress).digest()),
  );
  const contract = new Contract(p.anchorContractId);
  return contract.call(
    'anchor_with_range',
    new Address(p.workerAddress).toScVal(),
    new Address(p.companyAddress).toScVal(),
    nativeToScVal(contractHash, { type: 'bytes' }),
    nativeToScVal(metadata, { type: 'string' }),
    nativeToScVal(workerAddressHash, { type: 'bytes' }),
    nativeToScVal(p.rangeMinCents, { type: 'u64' }),
    nativeToScVal(p.rangeMaxCents, { type: 'u64' }),
  );
}

/**
 * Simulate the anchor op with the worker as source. Returns the simulation (for
 * footprint assembly), the required auth entries, and a validUntil ledger the
 * company signature should be good through.
 */
async function simulateAnchor(
  op: xdr.Operation,
  workerAddress: string,
): Promise<{
  sim: rpc.Api.SimulateTransactionSuccessResponse;
  entries: xdr.SorobanAuthorizationEntry[];
  validUntil: number;
}> {
  const account = await sorobanServer.getAccount(workerAddress);
  const tx = new TransactionBuilder(account, { fee: SIM_FEE, networkPassphrase })
    .addOperation(op)
    .setTimeout(120)
    .build();
  const sim = await sorobanServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`anchor simulate failed: ${sim.error}`);
  }
  const entries = (sim.result?.auth ?? []) as xdr.SorobanAuthorizationEntry[];
  const latest = await sorobanServer.getLatestLedger();
  return { sim, entries, validUntil: latest.sequence + 500 };
}

/**
 * The address-credential auth entry that requires `companyAddress`, or null. It
 * is null when the deployed contract does not require company auth (pre-M2),
 * which lets callers fall back to the single-party anchor.
 */
export function findCompanyAuthEntry(
  entries: xdr.SorobanAuthorizationEntry[],
  companyAddress: string,
): xdr.SorobanAuthorizationEntry | null {
  for (const e of entries) {
    const c = e.credentials();
    if (
      c.switch().name === 'sorobanCredentialsAddress' &&
      Address.fromScAddress(c.address().address()).toString() === companyAddress
    ) {
      return e;
    }
  }
  return null;
}

/** How the company entry gets signed. A Keypair for the company works directly. */
export type CompanyEntrySigner = (
  entry: xdr.SorobanAuthorizationEntry,
  validUntil: number,
) => Promise<xdr.SorobanAuthorizationEntry>;

/** Sign the company entry with a company Keypair (server-held key). */
export function companyKeypairSigner(companyKeypair: Keypair): CompanyEntrySigner {
  return (entry, validUntil) =>
    authorizeEntry(entry, companyKeypair, validUntil, networkPassphrase);
}

/**
 * Build the anchor transaction ready for the worker (the source) to sign, with
 * the company's authorization entry already co-signed when the deployed contract
 * requires it. Returns `cosigned: false` (and a plain single-party transaction)
 * when the contract does not require company auth, so the flow keeps working both
 * before and after the M2 redeploy.
 */
export async function buildCosignedAnchorTx(args: {
  params: AnchorParams;
  companySign: CompanyEntrySigner;
}): Promise<{ cosigned: boolean; tx: Transaction; validUntil: number }> {
  const op = buildAnchorWithRangeOp(args.params);
  const { sim, entries, validUntil } = await simulateAnchor(op, args.params.workerAddress);

  const companyEntry = findCompanyAuthEntry(entries, args.params.companyAddress);

  let assembleInput = op;
  let cosigned = false;
  if (companyEntry) {
    const signedCompany = await args.companySign(companyEntry, validUntil);
    const finalEntries = entries.map((e) => (e === companyEntry ? signedCompany : e));
    const func = op.body().invokeHostFunctionOp().hostFunction();
    assembleInput = Operation.invokeHostFunction({ func, auth: finalEntries });
    cosigned = true;
  }

  // Re-fetch the account so the transaction carries the worker's live sequence
  // (the simulation build above bumped a throwaway copy).
  const account = await sorobanServer.getAccount(args.params.workerAddress);
  const raw = new TransactionBuilder(account, { fee: SIM_FEE, networkPassphrase })
    .addOperation(assembleInput)
    .setTimeout(120)
    .build();
  // assembleTransaction sets the Soroban resource footprint + fee and preserves
  // the operation's existing auth (our co-signed entries) when it is non-empty.
  const tx = rpc.assembleTransaction(raw, sim).build();
  return { cosigned, tx, validUntil };
}

/**
 * Full server-side two-party anchor: build, co-sign the company entry, sign the
 * worker envelope with the worker keypair, submit, and confirm. Used where the
 * caller holds both keys (the demo seed and the headless validation script).
 * Returns the confirmed tx hash and whether a company co-signature was attached.
 */
export async function submitTwoPartyAnchor(args: {
  params: AnchorParams;
  workerKeypair: Keypair;
  companySign: CompanyEntrySigner;
}): Promise<{ hash: string; cosigned: boolean }> {
  const { tx, cosigned } = await buildCosignedAnchorTx({
    params: args.params,
    companySign: args.companySign,
  });
  tx.sign(args.workerKeypair);

  const sent = await sorobanServer.sendTransaction(tx);
  if (sent.status === 'ERROR') {
    throw new Error(`anchor send failed: ${JSON.stringify(sent.errorResult)}`);
  }
  let got = await sorobanServer.getTransaction(sent.hash);
  for (let i = 0; got.status === 'NOT_FOUND' && i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    got = await sorobanServer.getTransaction(sent.hash);
  }
  if (got.status !== 'SUCCESS') {
    throw new Error(`anchor not confirmed (${got.status})`);
  }
  return { hash: sent.hash, cosigned };
}
