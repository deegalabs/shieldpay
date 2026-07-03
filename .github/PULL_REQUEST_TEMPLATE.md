<!-- Keep the description specific and honest. State what changed and why. -->

## What this changes

<!-- A short, plain summary. Link any related issue. -->

## Why

<!-- The reason for the change, not just the what. -->

## Checklist

- [ ] `pnpm typecheck` passes.
- [ ] `pnpm build` passes.
- [ ] `pnpm test` passes (if the change has test coverage).
- [ ] `cd contracts && cargo test` passes (for contract changes).
- [ ] Circuit changes run `pnpm zk:prove` and update versioned artifacts.
- [ ] Inputs are validated with zod, SQL is parameterized, no secret is committed.
- [ ] Text is in English with no em-dashes, and the docs are honest about any
      partial or deferred work.
- [ ] One coherent change, commit format `type(scope): description`, no AI
      co-author trailer.

## Notes for reviewers

<!-- Anything specific to look at, trade-offs, or follow-ups. -->
