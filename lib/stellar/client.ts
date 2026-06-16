import {
  rpc,
  Horizon,
  Networks,
  Keypair,
} from '@stellar/stellar-sdk';
import { RPC_URL, HORIZON_URL, FRIENDBOT_URL, NETWORK } from '@/lib/constants';

/**
 * Stellar SDK clients.
 *
 * IMPORTANT (SDK v15.x): Soroban RPC lives under the `rpc` namespace
 * (`new rpc.Server(...)`). The old `SorobanRpc.Server` and the separate
 * `soroban-client` package are deprecated — do not import them.
 */

export const networkPassphrase =
  NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

/** Soroban RPC client — used for contract simulation/invocation. */
export const sorobanServer = new rpc.Server(RPC_URL, {
  allowHttp: RPC_URL.startsWith('http://'),
});

/** Horizon client — used for classic payments, accounts, trustlines. */
export const horizonServer = new Horizon.Server(HORIZON_URL);

/** Load a classic account (sequence number, balances) from Horizon. */
export async function loadAccount(publicKey: string) {
  return horizonServer.loadAccount(publicKey);
}

/**
 * Fund a testnet account via Friendbot.
 * No-op guidance: only works on testnet/futurenet.
 */
export async function fundTestnetAccount(publicKey: string): Promise<void> {
  if (NETWORK !== 'testnet') {
    throw new Error('Friendbot funding is only available on testnet');
  }
  const res = await fetch(`${FRIENDBOT_URL}/?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    throw new Error(`Friendbot funding failed: ${res.status} ${await res.text()}`);
  }
}

/** Generate a fresh keypair (used for mock/seed data). */
export function generateKeypair(): { publicKey: string; secret: string } {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secret: kp.secret() };
}
