import {
  Account,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { sorobanServer, networkPassphrase } from './client';
import { CONTRACTS } from '@/lib/constants';
import { buildRecordProofOp, buildRecordPayrollOp } from './record-op';
import type { CompanySigner } from './signer';

/**
 * Server-side Soroban invocations against the deployed PaymentVerifier.
 * The company key signs (it is the `company` arg, which require_auth's).
 */

function bytesScVal(buf: Buffer): xdr.ScVal {
  return nativeToScVal(buf, { type: 'bytes' });
}

export async function invokeAndConfirm(
  kp: Keypair,
  operation: xdr.Operation,
): Promise<{ hash: string; returnValue: unknown }> {
  const account = await sorobanServer.getAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: '1000000', // inclusion fee; Soroban resource fees added by prepareTransaction
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  const prepared = await sorobanServer.prepareTransaction(tx);
  prepared.sign(kp);

  const sent = await sorobanServer.sendTransaction(prepared);
  if (sent.status === 'ERROR') {
    throw new Error(`sendTransaction failed: ${JSON.stringify(sent.errorResult)}`);
  }

  let got = await sorobanServer.getTransaction(sent.hash);
  for (let i = 0; got.status === 'NOT_FOUND' && i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    got = await sorobanServer.getTransaction(sent.hash);
  }
  if (got.status !== 'SUCCESS') {
    throw new Error(`transaction ${sent.hash} status: ${got.status}`);
  }
  return {
    hash: sent.hash,
    returnValue: got.returnValue ? scValToNative(got.returnValue) : null,
  };
}

/**
 * Verify a Groth16 proof on-chain and record it. Returns the proof id and the
 * Stellar transaction hash (the proof of on-chain verification).
 */
export async function recordProofOnChain(args: {
  signer: CompanySigner; // the company; server-held key or browser wallet
  workerAddressHash: Buffer; // 32 bytes
  paymentTxHash: Buffer; // 32 bytes
  valueCommitment: Buffer; // 32 bytes
  proofBytes: Buffer; // 256 bytes
  publicSignalsBytes: Buffer;
}): Promise<{ proofId: string; txHash: string }> {
  if (!CONTRACTS.paymentVerifier) {
    throw new Error('PAYMENT_VERIFIER_CONTRACT_ID not configured');
  }
  const op = buildRecordProofOp({
    contractId: CONTRACTS.paymentVerifier,
    companyAddress: args.signer.address,
    workerAddressHash: args.workerAddressHash,
    paymentTxHash: args.paymentTxHash,
    valueCommitment: args.valueCommitment,
    proofBytes: args.proofBytes,
    publicSignalsBytes: args.publicSignalsBytes,
  });

  const { hash, returnValue } = await args.signer.invoke(op);
  return { proofId: String(returnValue ?? ''), txHash: hash };
}

/**
 * Verify + record the aggregate Proof-of-Payroll on-chain: one proof that the
 * run's hidden amounts sum to `total` and each is in range, revealing no salary.
 * Returns the payroll proof id and the tx hash.
 */
export async function recordPayrollProofOnChain(args: {
  signer: CompanySigner;
  runRef: Buffer; // 32 bytes
  total: number; // USDC cents
  proofBytes: Buffer;
  publicSignalsBytes: Buffer;
}): Promise<{ proofId: string; txHash: string }> {
  if (!CONTRACTS.payrollVerifier) {
    throw new Error('PAYROLL_VERIFIER_CONTRACT_ID not configured');
  }
  const op = buildRecordPayrollOp({
    contractId: CONTRACTS.payrollVerifier,
    companyAddress: args.signer.address,
    runRef: args.runRef,
    total: args.total,
    proofBytes: args.proofBytes,
    publicSignalsBytes: args.publicSignalsBytes,
  });
  const { hash, returnValue } = await args.signer.invoke(op);
  return { proofId: String(returnValue ?? ''), txHash: hash };
}

/** Read-only check whether a payment tx hash has a recorded proof. */
export async function isVerifiedOnChain(paymentTxHash: Buffer): Promise<boolean> {
  if (!CONTRACTS.paymentVerifier) return false;
  const contract = new Contract(CONTRACTS.paymentVerifier);
  const op = contract.call('is_verified', bytesScVal(paymentTxHash));
  try {
    // A read-only simulation does not require a funded source, so use a local
    // throwaway account instead of fetching one (which always failed before).
    const source = new Account(Keypair.random().publicKey(), '0');
    const tx = new TransactionBuilder(source, { fee: '100', networkPassphrase })
      .addOperation(op)
      .setTimeout(30)
      .build();
    const sim = await sorobanServer.simulateTransaction(tx);
    if ('result' in sim && sim.result?.retval) {
      return Boolean(scValToNative(sim.result.retval));
    }
  } catch {
    /* read-only best effort */
  }
  return false;
}

/**
 * Read-only check, against the AnchorRegistry, whether a worker address is
 * anchored for a company. This is the on-chain source of truth for the identity
 * anchor, so the server can confirm an anchor instead of trusting a client hash.
 */
export async function isAnchoredOnChain(
  workerAddress: string,
  companyAddress: string,
): Promise<boolean> {
  if (!CONTRACTS.anchorRegistry) return false;
  const contract = new Contract(CONTRACTS.anchorRegistry);
  const op = contract.call(
    'is_anchored',
    nativeToScVal(workerAddress, { type: 'address' }),
    nativeToScVal(companyAddress, { type: 'address' }),
  );
  try {
    const source = new Account(Keypair.random().publicKey(), '0');
    const tx = new TransactionBuilder(source, { fee: '100', networkPassphrase })
      .addOperation(op)
      .setTimeout(30)
      .build();
    const sim = await sorobanServer.simulateTransaction(tx);
    if ('result' in sim && sim.result?.retval) {
      return Boolean(scValToNative(sim.result.retval));
    }
  } catch {
    /* read-only best effort */
  }
  return false;
}
