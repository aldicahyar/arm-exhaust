import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../../backend');
const backendEnvPath = path.resolve(backendDir, '.env');

const BASE = process.env.BASE_URL ?? process.env.BACKEND_URL ?? 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@armexhaust.id';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin12345';
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? 'superadmin@armexhaust.id';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? 'SuperAdmin123!';

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && fs.existsSync(backendEnvPath)) {
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      databaseUrl = trimmed.slice('DATABASE_URL='.length).trim();
      break;
    }
  }
}
if (!databaseUrl) {
  databaseUrl = 'postgresql://postgres:admin@localhost:5432/ARM_EXHAUST';
}

let spawnedServer = null;

async function resetRateLimits() {
  try {
    const pgPath = (await import('node:url')).pathToFileURL(
      path.resolve(backendDir, 'node_modules/pg/lib/index.js'),
    ).href;
    const { default: pg } = await import(pgPath);
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("DELETE FROM transaction.t_trx_rate_limits WHERE action = 'login'");
    await client.end();
  } catch (err) {
    // Non-fatal if DB cleanup cannot run directly
  }
}

async function isServerReady() {
  try {
    const res = await fetch(`${BASE}/api/auth/me`, { signal: AbortSignal.timeout(1000) });
    return res.status === 200 || res.status === 401;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isServerReady()) {
    return;
  }

  console.log(`[INFO] Starting backend server from ${backendDir}...`);
  spawnedServer = spawn('node', ['dist/main.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env },
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 20000) {
    await new Promise((r) => setTimeout(r, 600));
    if (await isServerReady()) {
      console.log(`[INFO] Backend server started successfully at ${BASE}`);
      return;
    }
  }
  throw new Error('Backend server failed to start within 20s');
}

function getCookie(res) {
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length > 0) {
    const [cookie] = setCookie[0].split(';');
    return cookie;
  }
  const raw = res.headers.get('set-cookie');
  if (raw) {
    const [cookie] = raw.split(';');
    return cookie;
  }
  return null;
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.status !== 200) {
    const text = await res.text();
    throw new Error(`Login failed for ${email} with status ${res.status}: ${text}`);
  }
  const cookie = getCookie(res);
  if (!cookie) {
    throw new Error(`No cookie returned for ${email}`);
  }
  return cookie;
}

async function cleanup() {
  if (spawnedServer) {
    spawnedServer.kill('SIGTERM');
    spawnedServer = null;
  }
}

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(1);
});

console.log("Menjalankan verifikasi RBAC guards endpoint backend...");

try {
  await resetRateLimits();
  await ensureServer();

  // 1. Authenticate as regular Admin
  console.log('\n--- [1/4] Authenticating as regular Admin (admin@armexhaust.id) ---');
  const adminCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('✅ Admin authenticated successfully.');

  // Verify Admin can access operational routes
  const adminUsersRes = await fetch(`${BASE}/api/admin/users`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(adminUsersRes.status, 200, `Expected 200 for admin on /api/admin/users, got ${adminUsersRes.status}`);
  console.log('✅ Admin can access /api/admin/users (200 OK)');

  const adminInvitesRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(adminInvitesRes.status, 200, `Expected 200 for admin on /api/admin/reseller-invites, got ${adminInvitesRes.status}`);
  console.log('✅ Admin can access /api/admin/reseller-invites (200 OK)');

  // Verify Admin is FORBIDDEN (403) from accessing superadmin sensitive endpoints
  console.log('\n--- [2/4] Verifying Admin is Forbidden (403) from Superadmin Endpoints ---');

  const adminSecGet = await fetch(`${BASE}/api/admin/config`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(adminSecGet.status, 403, `Expected 403 for admin on GET /api/admin/config, got ${adminSecGet.status}`);
  console.log('✅ Admin blocked from GET /api/admin/config (403 Forbidden)');

  const adminSecGetAlias = await fetch(`${BASE}/api/admin/security/config`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(adminSecGetAlias.status, 403, `Expected 403 for admin on GET /api/admin/security/config, got ${adminSecGetAlias.status}`);
  console.log('✅ Admin blocked from GET /api/admin/security/config (403 Forbidden)');

  const adminSecPut = await fetch(`${BASE}/api/admin/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({ key: 'otp.ttl_minutes', value: 15 }),
  });
  assert.equal(adminSecPut.status, 403, `Expected 403 for admin on PUT /api/admin/config, got ${adminSecPut.status}`);
  console.log('✅ Admin blocked from PUT /api/admin/config (403 Forbidden)');

  const adminTaxGet = await fetch(`${BASE}/api/admin/tax`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(adminTaxGet.status, 403, `Expected 403 for admin on GET /api/admin/tax, got ${adminTaxGet.status}`);
  console.log('✅ Admin blocked from GET /api/admin/tax (403 Forbidden)');

  const adminTaxPut = await fetch(`${BASE}/api/admin/tax`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({ taxPercent: 12 }),
  });
  assert.equal(adminTaxPut.status, 403, `Expected 403 for admin on PUT /api/admin/tax, got ${adminTaxPut.status}`);
  console.log('✅ Admin blocked from PUT /api/admin/tax (403 Forbidden)');

  const adminPoliciesGet = await fetch(`${BASE}/api/admin/policies`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(adminPoliciesGet.status, 403, `Expected 403 for admin on GET /api/admin/policies, got ${adminPoliciesGet.status}`);
  console.log('✅ Admin blocked from GET /api/admin/policies (403 Forbidden)');

  // 2. Authenticate as Superadmin
  console.log('\n--- [3/4] Authenticating as Superadmin (superadmin@armexhaust.id) ---');
  const superCookie = await login(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  console.log('✅ Superadmin authenticated successfully.');

  // Verify Superadmin can access operational routes
  const superUsersRes = await fetch(`${BASE}/api/admin/users`, {
    headers: { cookie: superCookie },
  });
  assert.equal(superUsersRes.status, 200, `Expected 200 for superadmin on /api/admin/users, got ${superUsersRes.status}`);
  console.log('✅ Superadmin can access operational /api/admin/users (200 OK)');

  // Verify Superadmin CAN access superadmin sensitive endpoints
  console.log('\n--- [4/4] Verifying Superadmin has full access to configuration endpoints ---');

  const superSecGet = await fetch(`${BASE}/api/admin/config`, {
    headers: { cookie: superCookie },
  });
  assert.equal(superSecGet.status, 200, `Expected 200 for superadmin on GET /api/admin/config, got ${superSecGet.status}`);
  const secData = await superSecGet.json();
  assert.ok(secData?.config && secData?.items, 'Security config payload should include config and items');
  console.log('✅ Superadmin accessed GET /api/admin/config (200 OK)');

  const superSecAlias = await fetch(`${BASE}/api/admin/security/config`, {
    headers: { cookie: superCookie },
  });
  assert.equal(superSecAlias.status, 200, `Expected 200 for superadmin on GET /api/admin/security/config, got ${superSecAlias.status}`);
  console.log('✅ Superadmin accessed GET /api/admin/security/config (200 OK)');

  // Superadmin Tax config test
  const superTaxGet = await fetch(`${BASE}/api/admin/tax`, {
    headers: { cookie: superCookie },
  });
  assert.equal(superTaxGet.status, 200, `Expected 200 for superadmin on GET /api/admin/tax, got ${superTaxGet.status}`);
  const taxData = await superTaxGet.json();
  assert.ok(typeof taxData.taxPercent === 'number', 'Expected numeric taxPercent property');
  console.log(`✅ Superadmin accessed GET /api/admin/tax (200 OK, current: ${taxData.taxPercent}%)`);

  // Superadmin Tax config update
  const superTaxPut = await fetch(`${BASE}/api/admin/tax`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie: superCookie },
    body: JSON.stringify({ taxPercent: 12 }),
  });
  assert.equal(superTaxPut.status, 200, `Expected 200 for superadmin on PUT /api/admin/tax, got ${superTaxPut.status}`);
  const taxPutData = await superTaxPut.json();
  assert.equal(taxPutData.taxPercent, 12, 'taxPercent should be updated to 12');
  console.log('✅ Superadmin updated PUT /api/admin/tax to 12%');

  // Verify persistence
  const superTaxVerify = await fetch(`${BASE}/api/admin/tax`, {
    headers: { cookie: superCookie },
  });
  const taxVerifyData = await superTaxVerify.json();
  assert.equal(taxVerifyData.taxPercent, 12, 'Tax config should persist as 12%');

  // Restore tax to 11%
  await fetch(`${BASE}/api/admin/tax`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie: superCookie },
    body: JSON.stringify({ taxPercent: 11 }),
  });
  console.log('✅ Restored tax back to 11%');

  // Superadmin Discount Policies test
  const superPoliciesGet = await fetch(`${BASE}/api/admin/policies`, {
    headers: { cookie: superCookie },
  });
  assert.equal(superPoliciesGet.status, 200, `Expected 200 for superadmin on GET /api/admin/policies, got ${superPoliciesGet.status}`);
  const policiesData = await superPoliciesGet.json();
  assert.ok(Array.isArray(policiesData.policies), 'Expected array of policies in response');
  console.log(`✅ Superadmin accessed GET /api/admin/policies (200 OK, count: ${policiesData.policies.length})`);

  console.log('\n========================================');
  console.log('🎉 ALL RBAC GUARD VERIFICATIONS PASSED!');
  console.log('========================================');
} finally {
  await cleanup();
}
