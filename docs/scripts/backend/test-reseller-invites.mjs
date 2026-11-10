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
    // Non-fatal
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

  console.log('\n======================================================');
  console.log('--- TEST SUITE: VIP Tokenized Reseller Invites API ---');
  console.log('======================================================');

  // 1. Authenticate Admin and Customer
  console.log('\n--- [1/8] Authenticating Admin & Regular Customer ---');
  const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.equal(adminLoginRes.status, 200, `Admin login failed: ${adminLoginRes.status}`);
  const adminCookie = getCookie(adminLoginRes);
  assert.ok(adminCookie?.startsWith('arm_session='), 'Admin session cookie missing');

  // Customer session
  const custSub = `sub-cust-${Date.now()}`;
  const custEmail = `cust-${Date.now()}@test.local`;
  const custMockToken = `MOCK_GOOGLE_${custSub}_${custEmail}_CustTester`;
  const custLoginRes = await fetch(`${BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: custMockToken }),
  });
  assert.equal(custLoginRes.status, 200);
  const custCookie = getCookie(custLoginRes);

  console.log('[PASS] Admin and Customer sessions established.');

  // 2. Customer 403 Forbidden on Admin Invites Endpoints
  console.log('\n--- [2/8] Customer access rejection (403 Forbidden) ---');
  const forbiddenCreateRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: custCookie },
    body: JSON.stringify({ partnerName: 'Hacker Bengkel' }),
  });
  assert.equal(forbiddenCreateRes.status, 403, 'Customer must be rejected with 403 on create invite');

  const forbiddenListRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
    headers: { cookie: custCookie },
  });
  assert.equal(forbiddenListRes.status, 403, 'Customer must be rejected with 403 on list invites');
  console.log('[PASS] Customer blocked with 403 Forbidden.');

  // 3. Admin Creates Invite Token
  console.log('\n--- [3/8] Admin creating VIP reseller invite ---');
  const partnerName = `Bengkel Speed Star ${Date.now()}`;
  const createRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      partnerName,
      partnerPhone: '+6281299887766',
      expiresInHours: 48,
      roleToGrant: 'reseller',
    }),
  });
  assert.equal(createRes.status, 201, `Create invite failed: status ${createRes.status}`);
  const createData = await createRes.json();

  assert.ok(createData.token, 'Response missing invite token');
  assert.equal(createData.token.length, 64, 'Token must be 64-character hexadecimal crypto string');
  assert.equal(/^[0-9a-f]{64}$/i.test(createData.token), true, 'Token must be valid hex');
  assert.equal(createData.partnerName, partnerName);
  assert.equal(createData.roleToGrant, 'reseller');
  assert.ok(createData.inviteUrl.includes(createData.token), 'inviteUrl must contain token');
  assert.ok(new Date(createData.expiresAt) > new Date(), 'expiresAt must be in the future');

  const inviteToken = createData.token;
  const inviteId = createData.id;
  console.log(`[PASS] Created 64-char crypto invite token: ${inviteToken}`);

  // 4. Admin Lists Invites
  console.log('\n--- [4/8] Admin listing invites ---');
  const listRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.ok(Array.isArray(listData.invites || listData), 'Expected array of invites');
  const invitesArray = listData.invites || listData;
  const found = invitesArray.find((inv) => inv.token === inviteToken);
  assert.ok(found, 'Created invite not found in admin invites list');
  assert.equal(found.partner_name || found.partnerName, partnerName);
  console.log('[PASS] Invite listed in admin dashboard.');

  // 5. Public GET /api/reseller/invite-info (Valid, Non-existent, Revoked)
  console.log('\n--- [5/8] Public GET /api/reseller/invite-info checks ---');
  const infoRes = await fetch(`${BASE}/api/reseller/invite-info?token=${inviteToken}`);
  assert.equal(infoRes.status, 200, `Expected 200 for valid token, got ${infoRes.status}`);
  const infoData = await infoRes.json();
  assert.equal(infoData.valid, true);
  assert.equal(infoData.partnerName, partnerName);
  assert.equal(infoData.roleToGrant, 'reseller');
  assert.ok(infoData.expiresAt);

  // Non-existent token -> 404
  const notFoundRes = await fetch(`${BASE}/api/reseller/invite-info?token=non_existent_token_64_chars_0123456789abcdef0123456789abcdef0123456789abcdef`);
  assert.equal(notFoundRes.status, 404, `Expected 404 for invalid token, got ${notFoundRes.status}`);

  // Create another invite and test DELETE (Revocation)
  const revokeCreateRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({ partnerName: 'Bengkel Dibatalkan', expiresInHours: 24 }),
  });
  assert.equal(revokeCreateRes.status, 201);
  const toRevoke = await revokeCreateRes.json();

  const deleteRes = await fetch(`${BASE}/api/admin/reseller-invites/${toRevoke.id}`, {
    method: 'DELETE',
    headers: { cookie: adminCookie },
  });
  assert.equal(deleteRes.status, 200, `Revoke failed: status ${deleteRes.status}`);

  // Checking revoked token on invite-info -> 410 Gone
  const revokedInfoRes = await fetch(`${BASE}/api/reseller/invite-info?token=${toRevoke.token}`);
  assert.equal(
    revokedInfoRes.status,
    410,
    `Expected 410 Gone for revoked invite token, got ${revokedInfoRes.status}`,
  );
  console.log('[PASS] invite-info verified (valid 200, not found 404, revoked 410).');

  // 6. Mandatory Fresh Re-Authentication Enforced on Claim
  console.log('\n--- [6/8] Mandatory Fresh Re-Authentication enforcement ---');
  // Attempt claim without credentials -> 400 Bad Request
  const noCredRes = await fetch(`${BASE}/api/reseller/claim-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: inviteToken }),
  });
  assert.equal(
    noCredRes.status,
    400,
    `Expected 400 Bad Request when credentials omitted, got ${noCredRes.status}`,
  );

  // Attempt claim with invalid password -> 401 Unauthorized
  const badCredRes = await fetch(`${BASE}/api/reseller/claim-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: inviteToken, email: 'fake@armexhaust.id', password: 'wrong' }),
  });
  assert.equal(
    badCredRes.status,
    401,
    `Expected 401 Unauthorized for bad credentials, got ${badCredRes.status}`,
  );
  console.log('[PASS] Mandatory Fresh Re-Authentication enforced.');

  // 7. Successful Claim via Google SSO Fresh Auth
  console.log('\n--- [7/8] Executing VIP Invite Claim via Google SSO ---');
  const vipSub = `sub-vip-${Date.now()}`;
  const vipEmail = `vip-bengkel-${Date.now()}@speedstar.id`;
  const vipName = 'Owner Bengkel Speed Star';
  const vipMockToken = `MOCK_GOOGLE_${vipSub}_${vipEmail}_${encodeURIComponent(vipName)}`;

  const claimRes = await fetch(`${BASE}/api/reseller/claim-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: inviteToken,
      credential: vipMockToken,
    }),
  });
  assert.equal(claimRes.status, 200, `Claim invite failed: status ${claimRes.status}`);
  const claimData = await claimRes.json();
  assert.equal(claimData.success, true);
  assert.equal(claimData.user.role, 'reseller');
  assert.equal(claimData.user.email, vipEmail);

  const vipCookie = getCookie(claimRes);
  assert.ok(vipCookie?.startsWith('arm_session='), 'New session cookie must be set on claim');

  // Verify /me with new session returns role reseller
  const vipMeRes = await fetch(`${BASE}/api/auth/me`, { headers: { cookie: vipCookie } });
  const vipMe = await vipMeRes.json();
  assert.equal(vipMe.user.role, 'reseller');
  assert.equal(vipMe.user.can_access_b2b, true);
  console.log('[PASS] VIP invite successfully claimed; user upgraded to reseller with fresh session.');

  // 8. One-Time Use / Burn Enforcement: Second Claim Attempt MUST FAIL
  console.log('\n--- [8/8] One-time use burn check: second claim attempt ---');
  const secondClaimRes = await fetch(`${BASE}/api/reseller/claim-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: inviteToken,
      credential: vipMockToken,
    }),
  });
  assert.ok(
    secondClaimRes.status === 410 || secondClaimRes.status === 409,
    `Expected 410 Gone or 409 Conflict for already used token, got ${secondClaimRes.status}`,
  );

  // invite-info on claimed token must now return 410
  const claimedInfoRes = await fetch(`${BASE}/api/reseller/invite-info?token=${inviteToken}`);
  assert.equal(
    claimedInfoRes.status,
    410,
    `Expected 410 Gone on invite-info for claimed token, got ${claimedInfoRes.status}`,
  );
  console.log('[PASS] Token burning and anti-replay verified.');

  console.log('\n======================================================');
  console.log('SUCCESS: All VIP Reseller Invite tests passed 100%!');
  console.log('======================================================\n');
} finally {
  await cleanup();
}
