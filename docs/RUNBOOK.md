# ShieldPay: Runbook

Operational steps for the team. These actions touch production and are run by a
person, not automated from a development session.

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

1. Re-run the security probes against the live URL:
   - `POST /api/pay` returns 404
   - `GET /api/receipt?id=1` without a session or token returns 401
   - `GET /api/company` does not include `viewing_key`
2. Record the demo video.
3. Make the GitHub repository public.
4. Submit on DoraHacks.

## Useful commands

```
railway status                       # linked project, environment, services
railway logs --build                 # build logs for the latest deployment
railway logs                         # runtime logs
railway deployment list              # recent deployments and their status
railway connect Postgres             # psql against the prod database
```
