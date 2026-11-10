import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../../backend');

const BASE = process.env.BASE_URL ?? 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@armexhaust.id';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin12345';
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:admin@localhost:5432/ARM_EXHAUST';

let spawnedServer = null;

async function resetRateLimits() {
  try {
    const pgPath = (await import('node:url')).pathToFileURL(path.resolve(backendDir, 'node_modules/pg/lib/index.js')).href;
    const { default: pg } = await import(pgPath);
    const client = new pg.Client({ connectionString: DATABASE_URL });
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
    console.log(`[INFO] Server already running at ${BASE}`);
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

async function cleanup() {
  if (spawnedServer) {
    console.log('[INFO] Stopping spawned backend server...');
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

try {
  await resetRateLimits();
  await ensureServer();

  console.log('\n========================================');
  console.log('--- TEST SUITE: Admin Users & RBAC API ---');
  console.log('========================================');

  // 1. Setup Customer Session (using Google Mock or Register)
  console.log('\n--- [1/6] Setting up customer session ---');
  const custSub = `sub-cust-${Date.now()}`;
  const custEmail = `cust-${Date.now()}@test.local`;
  const custName = 'Customer Tester';
  const custMockToken = `MOCK_GOOGLE_${custSub}_${custEmail}_${encodeURIComponent(custName)}`;

  const custLoginRes = await fetch(`${BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: custMockToken }),
  });
  assert.equal(custLoginRes.status, 200, `Customer login failed: status ${custLoginRes.status}`);
  const custCookie = getCookie(custLoginRes);
  assert.ok(custCookie?.startsWith('arm_session='), 'Customer cookie not set');

  const custMeRes = await fetch(`${BASE}/api/auth/me`, { headers: { cookie: custCookie } });
  const custMe = await custMeRes.json();
  const customerUserId = custMe.user.id;
  assert.equal(custMe.user.role, 'customer');
  console.log(`[PASS] Customer session established: ${custEmail} (${customerUserId})`);

  // 2. Customer Attempting to Access Admin Endpoints -> MUST 403 Forbidden
  console.log('\n--- [2/6] Verifying 403 Forbidden for non-admin on /api/admin/* ---');
  const forbiddenUsersRes = await fetch(`${BASE}/api/admin/users`, {
    headers: { cookie: custCookie },
  });
  assert.equal(
    forbiddenUsersRes.status,
    403,
    `Expected 403 Forbidden for customer on GET /api/admin/users, got ${forbiddenUsersRes.status}`,
  );

  const forbiddenPatchRes = await fetch(`${BASE}/api/admin/users/${customerUserId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: custCookie },
    body: JSON.stringify({ role: 'admin' }),
  });
  assert.equal(
    forbiddenPatchRes.status,
    403,
    `Expected 403 Forbidden for customer on PATCH /api/admin/users/:id/role, got ${forbiddenPatchRes.status}`,
  );
  console.log('[PASS] Non-admin access rejected with 403 Forbidden as expected.');

  // 3. Admin Login
  console.log('\n--- [3/6] Admin Login ---');
  const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.equal(adminLoginRes.status, 200, `Admin login failed: ${adminLoginRes.status}`);
  const adminCookie = getCookie(adminLoginRes);
  assert.ok(adminCookie?.startsWith('arm_session='), 'Admin session cookie missing');
  console.log('[PASS] Admin authenticated successfully.');

  // 4. GET /api/admin/users with pagination, search, filter
  console.log('\n--- [4/6] Testing GET /api/admin/users ---');
  const allUsersRes = await fetch(`${BASE}/api/admin/users?page=1&limit=10`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(allUsersRes.status, 200, `GET /api/admin/users failed: status ${allUsersRes.status}`);
  const allUsersData = await allUsersRes.json();
  assert.ok(Array.isArray(allUsersData.users), 'Expected users to be an array');
  assert.ok(allUsersData.pagination, 'Expected pagination metadata');
  assert.equal(allUsersData.pagination.page, 1);
  assert.equal(allUsersData.pagination.limit, 10);
  assert.ok(typeof allUsersData.pagination.total === 'number');

  // Verify role details are attached
  const firstUser = allUsersData.users[0];
  assert.ok(firstUser.id, 'User missing id');
  assert.ok(firstUser.name, 'User missing name');
  assert.ok(firstUser.email, 'User missing email');
  assert.ok(firstUser.role, 'User missing role');
  assert.ok(
    firstUser.roleDetails || firstUser.role_details,
    'User missing roleDetails / role_details',
  );
  const roleInfo = firstUser.roleDetails || firstUser.role_details;
  assert.ok(roleInfo.name, 'role details missing name');
  assert.ok(typeof roleInfo.discount_percent !== 'undefined', 'role details missing discount_percent');

  // Test Filter by role: role=customer
  const filterCustRes = await fetch(`${BASE}/api/admin/users?role=customer&page=1&limit=5`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(filterCustRes.status, 200);
  const filterCustData = await filterCustRes.json();
  for (const u of filterCustData.users) {
    assert.equal(u.role, 'customer', `Filtered user role should be customer, got ${u.role}`);
  }

  // Test Search: search by customer name
  const searchRes = await fetch(`${BASE}/api/admin/users?search=${encodeURIComponent(custEmail)}`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(searchRes.status, 200);
  const searchData = await searchRes.json();
  assert.ok(searchData.users.some((u) => u.email === custEmail), 'Search did not find target user by email');
  console.log('[PASS] GET /api/admin/users pagination, filter, search, and role details verified.');

  // 5. PATCH /api/admin/users/:id/role - Invalid Role Check
  console.log('\n--- [5/6] Testing PATCH /api/admin/users/:id/role with invalid role ---');
  const invalidRoleRes = await fetch(`${BASE}/api/admin/users/${customerUserId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({ role: 'non_existent_role_999' }),
  });
  assert.equal(
    invalidRoleRes.status,
    400,
    `Expected 400 Bad Request for non-existent role, got ${invalidRoleRes.status}`,
  );
  console.log('[PASS] Invalid role rejected with 400 Bad Request.');

  // 6. PATCH /api/admin/users/:id/role - Valid Role Update & Revert
  console.log('\n--- [6/6] Testing PATCH /api/admin/users/:id/role valid update to reseller ---');
  const updateRes = await fetch(`${BASE}/api/admin/users/${customerUserId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({ role: 'reseller' }),
  });
  assert.equal(updateRes.status, 200, `Expected 200 OK on role update, got ${updateRes.status}`);
  const updateData = await updateRes.json();
  assert.equal(updateData.user.role, 'reseller', 'User role was not updated to reseller');

  // Verify customer session reflects new role on /me
  const updatedCustMe = await (
    await fetch(`${BASE}/api/auth/me`, { headers: { cookie: custCookie } })
  ).json();
  assert.equal(
    updatedCustMe.user.role,
    'reseller',
    'Customer /me session did not dynamically reflect updated role',
  );

  // Revert back to customer for idempotency
  const revertRes = await fetch(`${BASE}/api/admin/users/${customerUserId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({ role: 'customer' }),
  });
  assert.equal(revertRes.status, 200);
  console.log('[PASS] Valid role update and session synchronization verified.');

  console.log('\n========================================');
  console.log('SUCCESS: All Admin Users API tests passed 100%!');
  console.log('========================================\n');
} finally {
  await cleanup();
}
