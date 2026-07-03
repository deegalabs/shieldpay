# Contributing to ShieldPay

Thanks for your interest in ShieldPay. This is a hackathon entry built to a
product standard, so contributions are welcome and held to the same bar as the
rest of the codebase. Please read this before opening a pull request.

## Ground rules

- Everything in the repository is in English: code, comments, identifiers, commit
  messages, documentation, and sample data.
- Do not use em-dashes (the long dash) in repository text. Use periods, commas,
  colons, or parentheses.
- Write honestly. State only what the code, the history, or the brief support. If
  something is partial or deferred, say so. See `docs/ROADMAP.md` for what is
  shipped, what is base only, and what is deferred.
- Cryptography stays invisible in the end-user UI. Technical terms live in the
  legal receipts and the developer docs, not in the portal copy.

## Getting set up

- Runtime: Node 22 (see `.nvmrc`). Package manager: pnpm (not npm).
- Install: `pnpm install`.
- Useful scripts:
  - `pnpm dev` runs the app locally.
  - `pnpm typecheck` and `pnpm build` must both pass before you open a PR.
  - `pnpm test` runs the vitest suite.
  - `pnpm zk:setup` and `pnpm zk:prove` build and exercise the per-payment circuit.
  - `cd contracts && cargo test` runs the Soroban contract tests.

## Coding standards

- TypeScript with `strict` and `noUncheckedIndexedAccess`. Path aliases `@/`,
  `@/lib`, `@/components`.
- Files use `kebab-case` names. Components are Server Components by default;
  add `'use client'` only when needed, on the first line.
- Use semantic Tailwind tokens (`bg-surface`, `text-foreground`, `bg-brand`),
  never raw colors.
- API routes always set `export const runtime = 'nodejs'`, validate every input
  with `zod` at the top of the file, and follow the handler order: authentication,
  authorization by role or owner, logic, then `try/catch`. Use the standard status
  codes (400 validation, 401 no session, 403 wrong role, 404 not found, 422
  business rule, 503 database down).
- SQL is always parameterized, never concatenated. The exact amount of a payment
  is never stored in clear text, only the commitment and the range.
- Rust contracts keep tests in `src/test.rs` and must pass `cargo test`. Circuit
  runtime artifacts stay versioned.
- Docstrings in `lib/` explain the why, not the what.

## Commits and pull requests

- Commit format: `type(scope): description`, where type is one of `feat`, `fix`,
  `chore`, `docs`. Keep the message imperative and specific to the change.
- One commit per coherent change. Do not mix unrelated features.
- Do not add an AI co-author trailer. Commits belong to the human developers.
- Keep pull requests focused. Fill in the pull request template, and confirm that
  typecheck, build, and the relevant tests pass.

## Security

Do not open a public issue for a vulnerability. Follow `SECURITY.md` for private
reporting. We run a security audit before publishing, before each deploy, and
whenever authentication, authorization, or fund movement changes.

## Code of conduct

By participating you agree to uphold our `CODE_OF_CONDUCT.md`.
