# ShieldPay: Decisions Log

Technical decisions and deferred work that the team should not lose. Security
findings live in the internal `SECURITY_AUDIT.md`; this file is for everything
else (tooling, architecture, product trade-offs).

## Open decisions

### Package manager: move to pnpm after the hackathon

Today the project uses npm (`package-lock.json`, Railway Nixpacks runs
`npm run build`).

- **pnpm** is the recommended target: faster installs, a content-addressable
  store that saves disk, and stricter resolution that prevents phantom
  dependencies. It is a drop-in for npm, and Railway Nixpacks auto-detects it
  from `pnpm-lock.yaml`.
- **bun** is not recommended here. It is also a runtime, and the project leans on
  wasm and native dependencies (snarkjs, circomlibjs, pg, stellar-sdk) plus Next
  on Railway. That is too much compatibility risk for the value.

Decision: switch to pnpm after the hackathon, in a dedicated and verified step
(regenerate the lockfile, set the `packageManager` field, update scripts and
docs that say npm, confirm the Railway build and deploy). Doing it now risks the
deploy near the deadline, so it is deferred.

### Confidential proving: move proof generation to the client

The strongest privacy upgrade for the product is generating the ZK proof in the
company's browser, so the exact amount (the witness) never reaches the server.
Today proving is server-side, so the server sees the amount and seals it under
the viewing key. Operational separation (a worker or queue) is a separate, scale
driven decision and is not needed yet. See the architecture notes for context.

### Domain: Brazilian tax id fields

The schema uses `cpf_hash` and `cnpj`, which are Brazilian concepts. The product
is positioned as Web3-native and global. Renaming these to generic fields (for
example `tax_id`) is a database migration tied to the positioning, to be planned
separately. Sample values are placeholders.
