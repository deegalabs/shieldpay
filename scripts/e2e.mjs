// End-to-end smoke: boots the production build and asserts the app actually
// runs and renders. Covers routing, RBAC redirects, security headers, and the
// rendered content of the public pages. Database-independent, so it runs with
// no secrets, locally or in CI.
//
//   pnpm build && pnpm e2e
//
// The full payment flow (invite, anchor, payroll, disclosure) needs Privy, a
// database and testnet keys, so it is exercised on a configured environment,
// not here.
import { spawn } from 'node:child_process';

const PORT = process.env.E2E_PORT || '3100';
const base = `http://localhost:${PORT}`;
let failures = 0;

function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? `  (${detail})` : ''}`);
}

async function get(path, init) {
  return fetch(base + path, { redirect: 'manual', ...init });
}

async function waitForReady(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const server = spawn('pnpm', ['exec', 'next', 'start', '-p', PORT], {
  stdio: 'ignore',
  env: process.env,
});

try {
  console.log(`Booting production server on ${base} ...`);
  const ready = await waitForReady();
  if (!ready) throw new Error('server did not become ready in time');

  // Public pages render with their key content.
  const pages = [
    ['/', 'ShieldPay'],
    ['/login', 'Welcome back'],
    ['/signup', 'Create your account'],
    ['/help', 'Help'],
  ];
  for (const [path, needle] of pages) {
    const r = await get(path);
    const html = await r.text();
    check(`GET ${path} renders "${needle}"`, r.status === 200 && html.includes(needle), `status ${r.status}`);
  }

  // RBAC: a protected page redirects to login without a session.
  const dash = await get('/dashboard');
  check('GET /dashboard redirects to /login', dash.status === 307 && (dash.headers.get('location') || '').includes('/login'), `status ${dash.status}`);

  // Protected API rejects an unauthenticated caller.
  const company = await get('/api/company');
  check('GET /api/company without session is 401', company.status === 401, `status ${company.status}`);

  // Security headers are present on a public response.
  const root = await get('/');
  check('X-Frame-Options: DENY', root.headers.get('x-frame-options') === 'DENY');
  check('Strict-Transport-Security present', !!root.headers.get('strict-transport-security'));
} catch (e) {
  console.error('\nE2E could not run:', e.message);
  failures++;
} finally {
  server.kill('SIGTERM');
}

console.log(failures === 0 ? '\nE2E passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
