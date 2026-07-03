import { Contract, nativeToScVal, type xdr } from '@stellar/stellar-sdk';

/**
 * Build the `verify_and_record` PaymentVerifier operation, with no signer and no
 * server-only dependency. Both the server path (soroban.ts) and the
 * non-custodial client orchestrator construct the same operation through here;
 * whoever holds the company key (server) or wallet (browser) then signs it.
 *
 * `companyAddress` must equal the account that signs, because the contract calls
 * `company_address.require_auth()`.
 */
export function buildRecordProofOp(args: {
  contractId: string;
  companyAddress: string;
  workerAddressHash: Buffer; // 32 bytes
  paymentTxHash: Buffer; // 32 bytes
  valueCommitment: Buffer; // 32 bytes
  proofBytes: Buffer; // 256 bytes
  publicSignalsBytes: Buffer;
}): xdr.Operation {
  if (!args.contractId) throw new Error('PaymentVerifier contract id not configured');
  const contract = new Contract(args.contractId);
  const bytes = (buf: Buffer) => nativeToScVal(buf, { type: 'bytes' });
  return contract.call(
    'verify_and_record',
    nativeToScVal(args.companyAddress, { type: 'address' }),
    bytes(args.workerAddressHash),
    bytes(args.paymentTxHash),
    bytes(args.valueCommitment),
    bytes(args.proofBytes),
    bytes(args.publicSignalsBytes),
  );
}

/**
 * Build the aggregate `verify_and_record_payroll` operation: proves the sum of a
 * run's hidden amounts equals `total` and each is within range, revealing no
 * salary. `runRef` is a unique 32-byte id for the run; `companyAddress` must be
 * the signer (the contract require_auth's it).
 */
export function buildRecordPayrollOp(args: {
  contractId: string;
  companyAddress: string;
  runRef: Buffer; // 32 bytes
  total: number; // u64, USDC cents
  proofBytes: Buffer;
  publicSignalsBytes: Buffer;
}): xdr.Operation {
  if (!args.contractId) throw new Error('Payroll verifier contract id not configured');
  const contract = new Contract(args.contractId);
  const bytes = (buf: Buffer) => nativeToScVal(buf, { type: 'bytes' });
  return contract.call(
    'verify_and_record_payroll',
    nativeToScVal(args.companyAddress, { type: 'address' }),
    bytes(args.runRef),
    nativeToScVal(BigInt(args.total), { type: 'u64' }),
    bytes(args.proofBytes),
    bytes(args.publicSignalsBytes),
  );
}

/**
 * Build the `verify_and_record_credential` IncomeVerifier operation: proves an
 * employer paid a worker a sum within a claimed range over N months, revealing no
 * monthly amount. `nullifier` is public signal 0 (Poseidon(secret, verifierId));
 * the contract binds the passed nullifier to the proof and rejects a repeat
 * presentation of the same nullifier. This call takes no company address and does
 * not require_auth, so any funded account can source and pay for it.
 */
export function buildRecordCredentialOp(args: {
  contractId: string;
  nullifier: Buffer; // 32 bytes
  proofBytes: Buffer; // 256 bytes
  publicSignalsBytes: Buffer;
}): xdr.Operation {
  if (!args.contractId) throw new Error('Income verifier contract id not configured');
  const contract = new Contract(args.contractId);
  const bytes = (buf: Buffer) => nativeToScVal(buf, { type: 'bytes' });
  return contract.call(
    'verify_and_record_credential',
    bytes(args.nullifier),
    bytes(args.proofBytes),
    bytes(args.publicSignalsBytes),
  );
}
