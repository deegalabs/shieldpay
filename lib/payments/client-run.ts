import { BrowserSigner } from '@/lib/stellar/browser-signer';
import { PUBLIC_CONTRACTS, MEMO_PREFIX, MEMO_VERSION } from '@/lib/constants';

type SignRawHash = (args: {
  address: string;
  chainType: 'stellar';
  hash: `0x${string}`;
}) => Promise<{ signature: string }>;

export interface PayrollLineInput {
  workerName: string;
  workerAddress: string;
  amountUsdc: number;
  minUsdc: number;
  maxUsdc: number;
}

/**
 * Non-custodial payroll run, orchestrated entirely from the company's browser.
 *
 *   1. /api/payroll/prepare  — the server generates each Groth16 proof (it needs
 *      the circuit artifacts on disk) and seals the disclosure, but signs nothing
 *      and never holds a company key.
 *   2. The company's own Privy wallet signs and submits verify_and_record (and a
 *      symbolic, recipient-visible settlement) for each line.
 *   3. /api/payroll/record  — the server confirms each proof landed on-chain and
 *      persists the payment.
 *
 * The company key never exists server-side on this path. If the public contract
 * id is not configured, the caller should fall back to the custodial endpoint.
 */
export function nonCustodialAvailable(): boolean {
  return Boolean(PUBLIC_CONTRACTS.paymentVerifier);
}

export async function runPayrollNonCustodial(args: {
  walletAddress: string;
  signRawHash: SignRawHash;
  reference: string;
  lines: PayrollLineInput[];
  onProgress?: (msg: string) => void;
}): Promise<{ runPublicId: string }> {
  if (!PUBLIC_CONTRACTS.paymentVerifier) {
    throw new Error('NEXT_PUBLIC_PAYMENT_VERIFIER_CONTRACT_ID is not configured');
  }
  const { walletAddress, signRawHash, reference, lines } = args;
  const progress = args.onProgress ?? (() => {});

  // Fund the company wallet so it can pay testnet fees (best-effort).
  progress('Preparing your wallet');
  await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(walletAddress)}`).catch(() => {});

  // 1. Prepare: server proves every line. No key, no signature.
  progress('Proving each payment');
  const prepRes = await fetch('/api/payroll/prepare', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reference, lines }),
  });
  const prep = await prepRes.json();
  if (!prepRes.ok) {
    throw new Error(typeof prep.error === 'string' ? prep.error : JSON.stringify(prep.error));
  }
  // Numeric internal id, threaded back to /record (payments.run_id + finalize).
  const runId: string = prep.runId;
  // Opaque id for the /payroll/[run] URL the caller navigates to.
  const runPublicId: string = prep.runPublicId;
  const prepared: any[] = prep.lines;

  const signer = new BrowserSigner(walletAddress, signRawHash);
  // Reuse the SDK the signer loads, so the heavy bundle never lands in the page
  // chunk (it loads only when a payroll actually runs).
  const sdk: any = await import('@stellar/stellar-sdk');
  const { Operation, Asset, Memo, Contract, nativeToScVal } = sdk;

  const buf = (hex: string) => Buffer.from(hex, 'hex');
  const bytesScVal = (b: Buffer) => nativeToScVal(b, { type: 'bytes' });

  const recorded = [];
  for (const p of prepared) {
    // 2a. The company wallet records the proof on-chain itself. Same call shape
    // as the server's buildRecordProofOp; built inline to keep the SDK lazy.
    progress(`Verifying ${p.workerName} on-chain`);
    const op = new Contract(PUBLIC_CONTRACTS.paymentVerifier).call(
      'verify_and_record',
      nativeToScVal(walletAddress, { type: 'address' }),
      bytesScVal(buf(p.workerAddressHash)),
      bytesScVal(buf(p.paymentTxHash)),
      bytesScVal(buf(p.valueCommitment)),
      bytesScVal(buf(p.proofBytes)),
      bytesScVal(buf(p.publicSignalsBytes)),
    );
    const { hash: proofTxHash, returnValue: proofId } = await signer.invoke(op);

    // 2b. Symbolic, recipient-visible settlement (best-effort; the salary is the
    // commitment, not this amount). Fund the recipient so a fresh testnet wallet
    // can receive it.
    let settlementTxHash: string | null = null;
    let settlementAsset: string | null = null;
    try {
      await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(p.workerAddress)}`).catch(() => {});
      const memoText = [MEMO_PREFIX, 'PAY', MEMO_VERSION, reference].join('|');
      let memo;
      if (Buffer.byteLength(memoText, 'utf8') <= 28) {
        memo = Memo.text(memoText);
      } else {
        const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(memoText));
        memo = Memo.hash(Buffer.from(new Uint8Array(d)));
      }
      const payOp = Operation.payment({
        destination: p.workerAddress,
        asset: Asset.native(),
        amount: '0.0000001',
      });
      const res = await signer.submitClassic([payOp], memo);
      settlementTxHash = res.hash;
      settlementAsset = 'XLM';
    } catch {
      /* settlement is best-effort; the proof record above is the binding event */
    }

    recorded.push({
      workerName: p.workerName,
      workerAddress: p.workerAddress,
      reference: p.reference,
      minUsdc: p.minUsdc,
      maxUsdc: p.maxUsdc,
      amountCents: p.amountCents,
      commitment: p.commitment,
      disclosure: p.disclosure ?? null,
      paymentTxHash: p.paymentTxHash,
      proofId: String(proofId ?? ''),
      proofTxHash,
      settlementTxHash,
      settlementAsset,
    });
  }

  // 3. Record: server confirms on-chain and persists.
  progress('Recording receipts');
  const recRes = await fetch('/api/payroll/record', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ runId, reference, lines: recorded }),
  });
  const rec = await recRes.json();
  if (!recRes.ok) {
    throw new Error(typeof rec.error === 'string' ? rec.error : JSON.stringify(rec.error));
  }
  return { runPublicId };
}
