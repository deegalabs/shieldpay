// Smoke test: asserts the live security and routing posture of a running app.
// Database-independent, so it passes against a local `pnpm start` and against
// the deployed URL. This is the automated version of the manual probes in
// docs/RUNBOOK.md. Run it after every deploy.
//
//   pnpm smoke                       # http://localhost:3000
//   pnpm smoke https://your-app.app  # a deployed URL

const base = (process.argv[2] || process.env.SMOKE_URL || 'http://localhost:3000').replace(/\/$/, '');

let failures = 0;
function check(name, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  if (!ok) failures++;
  console.log(`  [${mark}] ${name}${detail ? `  (${detail})` : ''}`);
}

async function req(path, init) {
  const res = await fetch(base + path, { redirect: 'manual', ...init });
  return res;
}

console.log(`Smoke test against ${base}\n`);

try {
  // Health and public pages respond.
  const health = await req('/api/health');
  const healthBody = await health.json().catch(() => ({}));
  check('GET /api/health is 200 + status ok', health.status === 200 && healthBody.status === 'ok', `status ${health.status}`);

  for (const p of ['/', '/login', '/help']) {
    const r = await req(p);
    check(`GET ${p} is 200`, r.status === 200, `status ${r.status}`);
  }

  // RBAC: a protected page redirects to login without a session.
  const dash = await req('/dashboard');
  const loc = dash.headers.get('location') || '';
  check('GET /dashboard redirects to /login', dash.status === 307 && loc.includes('/login'), `status ${dash.status}`);

  // Company API rejects an unauthenticated caller (middleware gate).
  const company = await req('/api/company');
  check('GET /api/company without session is 401', company.status === 401, `status ${company.status}`);

  // Default-deny: the removed legacy endpoints are gone.
  for (const p of ['/api/pay', '/api/proof', '/api/verify', '/api/anchor']) {
    const r = await req(p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    check(`POST ${p} is 404 (default-deny)`, r.status === 404, `status ${r.status}`);
  }

  // Receipt IDOR is closed: it never returns a PDF without auth.
  const receipt = await req('/api/receipt?id=1');
  check('GET /api/receipt?id=1 is not 200 (IDOR closed)', receipt.status !== 200, `status ${receipt.status}`);

  // Security headers are present.
  const root = await req('/');
  check('X-Frame-Options: DENY', root.headers.get('x-frame-options') === 'DENY');
  check('Strict-Transport-Security present', !!root.headers.get('strict-transport-security'));
} catch (e) {
  console.error('\nSmoke test could not reach the server:', e.message);
  process.exit(1);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
