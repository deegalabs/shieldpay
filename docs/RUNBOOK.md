# ShieldPay: Runbook

Operational steps for the team. These actions touch production and are run by a
person, not automated from a development session.

The production deployment is live on Railway at
`https://web-production-f389ce.up.railway.app`.

## ZK payroll circuit: build and deploy the Proof-of-Payroll verifier

Proof-of-Payroll is the aggregate proof for a run: one Groth16 proof shows the
per-line amounts sum to a public total and each amount is within its agreed
range, revealing no individual salary. It is verified on-chain by a **separate**
`PaymentVerifier` instance initialized with the payroll verification key, so it
does not share state with the per-payment verifier.

Honest limitation: the on-chain check currently binds only the public total. The
per-line ranges and commitments are enforced in the circuit off-chain but are not
yet bound on-chain per line.

### 1. Build the circuit and verification key

Requires `circom` and `snarkjs` on the machine.

```
bash circuits/scripts/build_payroll.sh
```

This compiles `circuits/payroll_proof/payroll_proof.circom` and produces the
proving and verification artifacts. The off-chain prover that consumes them is
`lib/zk/payroll-prover.ts`.

### 2. Deploy and initialize the payroll verifier instance

Deploy a second `PaymentVerifier` contract and initialize it with the payroll VK,
then call its `verify_and_record_payroll` method at run time.

```
stellar contract deploy --network testnet ...      # payroll verifier instance
stellar contract invoke ... -- initialize ...       # with the payroll VK
```

The live testnet instance is
`CCI4WXRQN5PHZFUHZQKIMXKFZA4EU7JS45UT2AEPKEACBGOGAORPFUTN`.

For reference, the existing per-payment contracts are:

- `PaymentVerifier`: `CAUK3NRZTPYJZY6GJYIALALFC6WTT6RKHAU6SU5PHWBNPUMFKZZWNXV3`
- `AnchorRegistry`: `CD5EFRVN5KUQ4FCNX6FNIICM7JNYG4ZIKRKIU5DPUVFYJOIMDGCCWYZI`

### 3. Wire the contract id into the environment

Set `PAYROLL_VERIFIER_CONTRACT_ID` on the `web` service, plus the
`NEXT_PUBLIC_PAYROLL_VERIFIER_CONTRACT_ID` mirror for the non-custodial client
path (see the environment reference below).

## Pre-launch hygiene (do before making the repo public)

Order matters. Do the cleanup and rotation first, verify, then go public.

### 1. Clean test data from the production database

Use the prepared script `scripts/cleanup_test_data.sql`. It runs inside a
transaction and shows what it will remove before you commit.

```
railway connect Postgres
\i scripts/cleanup_test_data.sql
```

Review the SELECT output, let the DELETEs run, check the final counts, then
`COMMIT;` if it looks right or `ROLLBACK;` if not. You can also paste the script
into the Railway dashboard Postgres query tab.

### 2. Rotate the Privy app secret

The secret was exposed during development.

1. Privy dashboard, your app, Settings, API keys, regenerate the App Secret.
2. Railway, `web` service, Variables, set `PRIVY_APP_SECRET` to the new value.
3. Save. Railway redeploys. `NEXT_PUBLIC_PRIVY_APP_ID` is public and does not
   change.
4. Sign in with email, Google, and a passkey to confirm login still works.

### 3. Rotate the treasury signing key

`COMPANY_SECRET_KEY` signs the on-chain settlement and the proof recording.
`COMPANY_PUBLIC_KEY` is used only as the demo company's owner id (a public key,
not a secret). They are independent variables, so you can rotate the secret
without disturbing the demo data.

1. Generate a new testnet keypair:
   `stellar keys generate shieldpay-treasury --network testnet`.
2. Fund the new account on testnet (friendbot or `stellar keys fund`). The
   settlement uses native XLM, so no USDC trustline is needed.
3. Railway, `web` service, Variables, set `COMPANY_SECRET_KEY` to the new secret.
4. Keep `COMPANY_PUBLIC_KEY` as is to preserve the demo company and its data.
   Only change it if you also migrate the demo data's `owner_sub`, or you accept
   an empty demo company.
5. Save, let Railway redeploy, run one small testnet payroll run to confirm
   settlement and proof still work from the new key.

### 4. Verify and go public

1. Run the smoke test against the live URL (it checks health, RBAC, default-deny,
   the closed receipt IDOR, and the security headers):
   ```
   pnpm smoke https://web-production-f389ce.up.railway.app
   ```
   All checks must pass. If any fail, the deploy is behind or a fix regressed.
2. Record the demo video.
3. Make the GitHub repository public.
4. Submit on DoraHacks.

## Demo login (isolated identity)

The product exposes a one-click demo login, gated by `ALLOW_DEMO_LOGIN`. It is
scoped to an isolated demo identity (`DEMO_COMPANY_SUB`) and never signs in as the
treasury-owning account. This keeps the public demo from touching real funds or
real company data. Leave `ALLOW_DEMO_LOGIN` off in any environment where the demo
path should not be reachable.

## Seed the demo data

`scripts/seed_demo.ts` provisions a full walkthrough: it anchors a worker, runs a
real payroll, and records an aggregate Proof-of-Payroll. It is gated by
`SEED_DEMO=1` so it cannot run by accident.

```
SEED_DEMO=1 pnpm seed:demo
```

## Cleanup script (guarded)

`scripts/cleanup_db.ts` removes data from a target database. It is guarded in two
stages: `CLEANUP_DB=1` runs a dry-run that only reports what it would remove, and
`CLEANUP_DB_APPLY=1` is required to actually apply the deletions.

```
CLEANUP_DB=1 pnpm cleanup:db          # dry-run, report only
CLEANUP_DB=1 CLEANUP_DB_APPLY=1 pnpm cleanup:db   # apply
```

## Environment reference

Set on the Railway `web` service:

- `DATABASE_URL`: Postgres connection string.
- `COMPANY_SECRET_KEY`: treasury signing key (custodial `ServerSigner` path).
- `COMPANY_PUBLIC_KEY`: demo company owner id (public key, not a secret).
- `ANCHOR_REGISTRY_CONTRACT_ID`: identity anchor contract.
- `PAYMENT_VERIFIER_CONTRACT_ID`: per-payment ZK verifier.
- `PAYROLL_VERIFIER_CONTRACT_ID`: aggregate Proof-of-Payroll verifier instance.
- `NEXT_PUBLIC_*` mirrors of the three contract ids, for the non-custodial client
  path where the company signs its own calls with its Privy wallet.
- `JWT_SECRET`: signs the role-scoped ShieldPay session.
- Privy keys: `NEXT_PUBLIC_PRIVY_APP_ID` (public) and `PRIVY_APP_SECRET`.
- `ALLOW_DEMO_LOGIN`, `DEMO_COMPANY_SUB`: gate and identity for the demo login.
- `SEED_DEMO`, `CLEANUP_DB`, `CLEANUP_DB_APPLY`: gates for the scripts above.

The non-custodial path lets the company sign its own on-chain calls with its Privy
wallet through `CompanySigner` (`BrowserSigner` client-side, `ServerSigner`
server-side). The endpoints `/api/payroll/prepare` (server proves, holds no key)
and `/api/payroll/record` (confirms on-chain and persists) drive it. The custodial
`ServerSigner` is the demo-safe fallback.

## Useful commands

```
railway status                       # linked project, environment, services
railway logs --build                 # build logs for the latest deployment
railway logs                         # runtime logs
railway deployment list              # recent deployments and their status
railway connect Postgres             # psql against the prod database
```
