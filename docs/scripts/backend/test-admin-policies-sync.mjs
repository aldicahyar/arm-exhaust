import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../../backend');
const backendEnvPath = path.resolve(backendDir, '.env');

const BASE = process.env.BASE_URL ?? 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@armexhaust.id';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin12345';

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

async function getPgClient() {
  const pgPath = (await import('node:url')).pathToFileURL(
    path.resolve(backendDir, 'node_modules/pg/lib/index.js'),
  ).href;
  const { default: pg } = await import(pgPath);
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  return client;
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

let dbClient = null;
let resellerEmail = null;
let createdInviteToken = null;

try {
  console.log('\n==================================================================');
  console.log('--- TEST SUITE: Admin & Auth Policies Synchronization (TDD) ---');
  console.log('==================================================================\n');

  dbClient = await getPgClient();

  // Reset rate limits
  await dbClient.query("DELETE FROM transaction.t_trx_rate_limits WHERE action = 'login'");

  await ensureServer();

  // 1. Admin login
  console.log('--- [1/5] Authenticating as Admin ---');
  const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.equal(adminLoginRes.status, 200, `Admin login failed: ${adminLoginRes.status}`);
  const adminCookie = getCookie(adminLoginRes);
  assert.ok(adminCookie?.startsWith('arm_session='), 'Admin session cookie missing');
  console.log('✅ Admin authenticated successfully.\n');

  // 2. Setup Reseller Session
  console.log('--- [2/5] Setting up reseller user session ---');
  const uniqueId = Date.now();
  resellerEmail = `reseller-sync-${uniqueId}@test.local`;
  const resellerSub = `sub-reseller-sync-${uniqueId}`;
  const resellerName = 'Reseller Policy Sync Tester';
  const mockToken = `MOCK_GOOGLE_${resellerSub}_${resellerEmail}_${encodeURIComponent(resellerName)}`;

  const resellerLoginRes = await fetch(`${BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: mockToken }),
  });
  assert.equal(resellerLoginRes.status, 200, `Reseller login failed: ${resellerLoginRes.status}`);
  const resellerCookie = getCookie(resellerLoginRes);
  assert.ok(resellerCookie?.startsWith('arm_session='), 'Reseller session cookie missing');

  // Update user role to 'reseller' in DB
  await dbClient.query(`UPDATE master.t_mtr_users SET role = 'reseller' WHERE email = $1`, [resellerEmail]);
  console.log(`✅ Reseller test user created and role set to 'reseller': ${resellerEmail}\n`);

  // 3. Test GET /api/auth/me with reseller session
  console.log('--- [3/5] Verifying GET /api/auth/me resolves discount from policies ---');
  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { cookie: resellerCookie },
  });
  assert.equal(meRes.status, 200, `GET /api/auth/me failed with status ${meRes.status}`);
  const meData = await meRes.json();
  assert.ok(meData?.user, 'Expected user object in /api/auth/me response');
  assert.equal(meData.user.role, 'reseller', `Expected user role to be reseller, got ${meData.user.role}`);
  assert.equal(
    meData.user.discount_percent,
    20,
    `Expected user.discount_percent === 20 (from RESELLER_BASE_20 policy), got ${meData.user.discount_percent}`,
  );
  const roleDetails = meData.user.roleDetails || meData.user.role_details;
  assert.ok(roleDetails, 'Expected roleDetails in /api/auth/me user');
  assert.equal(
    roleDetails.discount_percent,
    20,
    `Expected roleDetails.discount_percent === 20, got ${roleDetails.discount_percent}`,
  );
  console.log('✅ GET /api/auth/me returned correct dynamic discount_percent (20%) from discount policy.\n');

  // 4. Test GET /api/admin/roles (No column errors)
  console.log('--- [4/5] Verifying GET /api/admin/roles works without discount_percent column in roles table ---');
  const rolesRes = await fetch(`${BASE}/api/admin/roles`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(rolesRes.status, 200, `GET /api/admin/roles failed with status ${rolesRes.status}`);
  const roles = await rolesRes.json();
  assert.ok(Array.isArray(roles) && roles.length > 0, 'Expected non-empty roles array');
  const foundResellerRole = roles.find((r) => r.id === 'reseller');
  assert.ok(foundResellerRole, 'Expected reseller role to be in master roles list');
  console.log(`✅ GET /api/admin/roles succeeded with ${roles.length} roles, no database column errors.\n`);

  // 5. Test GET /api/admin/users & Reseller Invite Info
  console.log('--- [5/5] Verifying GET /api/admin/users and /api/reseller/invite-info dynamic policy discount ---');
  // 5a. GET /api/admin/users
  const adminUsersRes = await fetch(
    `${BASE}/api/admin/users?role=reseller&search=${encodeURIComponent(resellerEmail)}`,
    {
      headers: { cookie: adminCookie },
    },
  );
  assert.equal(adminUsersRes.status, 200, `GET /api/admin/users failed with status ${adminUsersRes.status}`);
  const usersData = await adminUsersRes.json();
  assert.ok(Array.isArray(usersData.users), 'Expected users array in /api/admin/users');
  const foundUser = usersData.users.find((u) => u.email === resellerEmail);
  assert.ok(foundUser, `Expected to find user ${resellerEmail} in admin users list`);
  const adminUserRoleDetails = foundUser.role_details || foundUser.roleDetails;
  assert.ok(adminUserRoleDetails, 'Expected role_details on admin user item');
  assert.equal(
    adminUserRoleDetails.discount_percent,
    20,
    `Expected admin user role_details.discount_percent === 20, got ${adminUserRoleDetails.discount_percent}`,
  );
  console.log('✅ GET /api/admin/users returned reseller user with discount_percent === 20.');

  // 5b. Create reseller invite & check invite-info
  const inviteRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      partnerName: 'Mitra Kebijakan Diskon',
      partnerPhone: '081299998888',
      roleToGrant: 'reseller',
      expiresInHours: 48,
    }),
  });
  assert.equal(inviteRes.status, 201, `POST /api/admin/reseller-invites failed with status ${inviteRes.status}`);
  const inviteData = await inviteRes.json();
  assert.ok(inviteData?.token, 'Expected inviteData to contain token');
  createdInviteToken = inviteData.token;

  const inviteInfoRes = await fetch(
    `${BASE}/api/reseller/invite-info?token=${encodeURIComponent(createdInviteToken)}`,
  );
  assert.equal(inviteInfoRes.status, 200, `GET /api/reseller/invite-info failed with status ${inviteInfoRes.status}`);
  const inviteInfo = await inviteInfoRes.json();
  assert.equal(inviteInfo.valid, true, 'Expected inviteInfo.valid === true');
  const resolvedDiscount = inviteInfo.discount_percent ?? inviteInfo.discountPercent;
  assert.equal(
    resolvedDiscount,
    20,
    `Expected invite-info discount_percent === 20, got ${resolvedDiscount}`,
  );
  console.log(`✅ GET /api/reseller/invite-info returned dynamic discount_percent === 20%.\n`);

  console.log('🎉 [SUCCESS] All Admin & Auth Policies Synchronization tests PASSED 100%!');
} finally {
  if (dbClient) {
    if (createdInviteToken) {
      await dbClient.query('DELETE FROM transaction.t_trx_reseller_invites WHERE token = $1', [createdInviteToken]);
    }
    if (resellerEmail) {
      await dbClient.query('DELETE FROM master.t_mtr_users WHERE email = $1', [resellerEmail]);
    }
    await dbClient.end();
  }
  await cleanup();
}
