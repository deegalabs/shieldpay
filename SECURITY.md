# Security Policy

ShieldPay handles payroll data and on-chain settlements, so we take security
seriously and treat the project as a real product, not only a hackathon entry.

## Scope

This policy covers the web app, the API, the Soroban contracts, and the ZK
circuit in this repository. The project currently runs on Stellar testnet.

## Reporting a vulnerability

Please report security issues privately. Do not open a public issue for a
vulnerability.

- Contact the maintainers directly through the repository owner's profile.
- Include steps to reproduce, the affected endpoint or contract, and the impact.
- Give us reasonable time to fix the issue before any public disclosure.

We will acknowledge the report, investigate, and keep you updated on the fix.

## Our practices

- Secrets live in environment variables, never in the code. `.env*` is ignored.
- All database access is parameterized.
- Sessions use signed JWTs in httpOnly cookies, with role-based route protection.
- We run a security audit before publishing the repository, before each deploy,
  and whenever authentication, authorization, or fund movement changes.

Internal audit findings are tracked privately until they are remediated, in line
with responsible disclosure.
