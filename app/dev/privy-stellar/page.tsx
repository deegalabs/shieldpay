'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Temporary DEV page to validate Privy + Stellar (Tier 2) in a real browser:
 *   1. login  2. create a Stellar embedded wallet  3. sign a raw hash
 *   4. (decisive) sign + submit a real testnet payment
 * Tells us whether N2's on-chain anchor can be built on Privy. Remove later.
 */
export default function PrivyStellarTest() {
  const { ready, authenticated, login, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();

  const [addr, setAddr] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const add = (m: string) => setLog((l) => [...l, m]);

  async function step2CreateWallet() {
    setBusy('create');
    try {
      const { wallet } = await createWallet({ chainType: 'stellar' });
      setAddr(wallet.address);
      add(`✅ Stellar wallet: ${wallet.address}`);
    } catch (e) {
      add(`❌ createWallet: ${String(e instanceof Error ? e.message : e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function step3SignHash() {
    setBusy('sign');
    try {
      const hash = ('0x' + '00'.repeat(31) + '01') as `0x${string}`;
      const { signature } = await signRawHash({ address: addr, chainType: 'stellar', hash });
      add(`✅ signRawHash ok: ${signature.slice(0, 26)}… (${(signature.length - 2) / 2} bytes)`);
    } catch (e) {
      add(`❌ signRawHash: ${String(e instanceof Error ? e.message : e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function step4Payment() {
    setBusy('pay');
    try {
      const sdk: any = await import('@stellar/stellar-sdk');
      const { TransactionBuilder, Operation, Asset, Networks, BASE_FEE, Keypair, Horizon, xdr } = sdk;

      add('… funding wallet via friendbot');
      await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(addr)}`).catch(() => {});

      const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
      const account = await horizon.loadAccount(addr);
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.payment({ destination: addr, asset: Asset.native(), amount: '1' }))
        .setTimeout(60)
        .build();

      const hashHex = ('0x' + tx.hash().toString('hex')) as `0x${string}`;
      const { signature } = await signRawHash({ address: addr, chainType: 'stellar', hash: hashHex });
      const sigBuf = Buffer.from(signature.replace(/^0x/, ''), 'hex');
      const hint = Keypair.fromPublicKey(addr).signatureHint();
      tx.signatures.push(new xdr.DecoratedSignature({ hint, signature: sigBuf }));

      const res = await horizon.submitTransaction(tx);
      add(`✅ DECISIVE: testnet payment accepted! tx ${res.hash.slice(0, 16)}…`);
    } catch (e: any) {
      const detail = e?.response?.data?.extras?.result_codes
        ? JSON.stringify(e.response.data.extras.result_codes)
        : String(e instanceof Error ? e.message : e);
      add(`❌ payment: ${detail}`);
    } finally {
      setBusy(null);
    }
  }

  async function step5Anchor() {
    setBusy('anchor');
    try {
      const sdk: any = await import('@stellar/stellar-sdk');
      const { rpc, Contract, TransactionBuilder, Networks, Address, nativeToScVal, Keypair, xdr } = sdk;
      const ANCHOR = 'CD5EFRVN5KUQ4FCNX6FNIICM7JNYG4ZIKRKIU5DPUVFYJOIMDGCCWYZI';
      const COMPANY = 'GCLQSBBXPQLGWCPC7ZQNKDDHRI4JUMUHFWY534BXWIF45HI3XLU6U2SM';
      const server = new rpc.Server('https://soroban-testnet.stellar.org');

      add('… funding (friendbot) + loading account');
      await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(addr)}`).catch(() => {});
      const account = await server.getAccount(addr);

      const contract = new Contract(ANCHOR);
      const contractHash = new Uint8Array(32).fill(7); // dummy doc hash for the test
      const op = contract.call(
        'anchor',
        new Address(addr).toScVal(),
        new Address(COMPANY).toScVal(),
        nativeToScVal(Buffer.from(contractHash), { type: 'bytes' }),
        nativeToScVal('CPF:test|CONTRACT:dev', { type: 'string' }),
      );

      let tx = new TransactionBuilder(account, { fee: '1000000', networkPassphrase: Networks.TESTNET })
        .addOperation(op)
        .setTimeout(120)
        .build();

      add('… simulating + preparing (Soroban)');
      tx = await server.prepareTransaction(tx);

      const hashHex = ('0x' + tx.hash().toString('hex')) as `0x${string}`;
      const { signature } = await signRawHash({ address: addr, chainType: 'stellar', hash: hashHex });
      const sigBuf = Buffer.from(signature.replace(/^0x/, ''), 'hex');
      tx.signatures.push(
        new xdr.DecoratedSignature({ hint: Keypair.fromPublicKey(addr).signatureHint(), signature: sigBuf }),
      );

      const sent = await server.sendTransaction(tx);
      add(`… sent ${sent.hash.slice(0, 12)}…, polling`);
      let got = await server.getTransaction(sent.hash);
      for (let i = 0; got.status === 'NOT_FOUND' && i < 20; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        got = await server.getTransaction(sent.hash);
      }
      if (got.status === 'SUCCESS') add(`✅ ANCHOR on-chain via Privy! tx ${sent.hash.slice(0, 18)}…`);
      else add(`❌ anchor status: ${got.status}`);
    } catch (e: any) {
      add(`❌ anchor: ${String(e?.message || e)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold">Privy + Stellar — validation</h1>
      <p className="mt-1 text-sm text-muted">Temporary dev page. Run the steps in order.</p>

      <Card className="mt-6 space-y-3 p-6">
        <Button className="w-full" disabled={!ready || authenticated} onClick={login}>
          1. {authenticated ? 'Logged in ✓' : 'Login with Privy'}
        </Button>
        <Button className="w-full" variant="ghost" disabled={!authenticated || !!busy} onClick={step2CreateWallet}>
          2. Create Stellar wallet
        </Button>
        <Button className="w-full" variant="ghost" disabled={!addr || !!busy} onClick={step3SignHash}>
          3. Sign a test hash
        </Button>
        <Button className="w-full" variant="ghost" disabled={!addr || !!busy} onClick={step4Payment}>
          4. Sign + submit a testnet payment (decisive)
        </Button>
        <Button className="w-full" variant="ghost" disabled={!addr || !!busy} onClick={step5Anchor}>
          5. Sign + submit a Soroban anchor (N2 decisive)
        </Button>
      </Card>

      <Card className="mt-4 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Log</p>
        {log.length === 0 ? (
          <p className="text-sm text-muted">Results appear here…</p>
        ) : (
          <ul className="space-y-1 break-all font-mono text-xs">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
        {user && <p className="mt-3 text-xs text-muted">Privy user: {user.id}</p>}
      </Card>
    </main>
  );
}
