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
  throw new Error('Backend failed to start within 20s');
}

function parseCookies(res) {
  const setCookie = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie')].filter(Boolean);
  return setCookie
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  const cookie = parseCookies(res);
  return { status: res.status, data, cookie };
}

async function main() {
  console.log('🏁 ========================================================');
  console.log('🏁 [E2E] FULL VIP RESELLER & DYNAMIC RBAC LIFECYCLE TEST');
  console.log('🏁 ========================================================');

  await resetRateLimits();
  await ensureServer();

  try {
    // ------------------------------------------------------------------------
    // Step 1: Admin Authentication
    // ------------------------------------------------------------------------
    console.log('\n[STEP 1] Logging in as Admin...');
    const adminLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    assert.equal(adminLogin.status, 200, `Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    assert.equal(adminLogin.data.user.role, 'admin');
    const adminCookie = adminLogin.cookie;
    console.log('  -> Admin logged in successfully.');

    // ------------------------------------------------------------------------
    // Step 2: Dynamic Roles Discovery
    // ------------------------------------------------------------------------
    console.log('\n[STEP 2] Fetching dynamic roles from master.t_mtr_roles...');
    const rolesRes = await fetch(`${BASE}/api/admin/roles`, {
      headers: { cookie: adminCookie },
    });
    assert.equal(rolesRes.status, 200);
    const rawRoles = await rolesRes.json();
    const rolesList = Array.isArray(rawRoles) ? rawRoles : rawRoles.roles;
    assert.ok(Array.isArray(rolesList), 'rolesList should be an array');
    const roleIds = rolesList.map((r) => r.id);
    console.log(`  -> Active system roles: [${roleIds.join(', ')}]`);
    assert.ok(roleIds.includes('admin'), 'Missing admin role');
    assert.ok(roleIds.includes('reseller'), 'Missing reseller role');
    assert.ok(roleIds.includes('customer'), 'Missing customer role');
    const resellerRole = rolesList.find((r) => r.id === 'reseller');
    assert.equal(resellerRole.discount_percent, 20, 'Reseller discount should be 20%');

    // ------------------------------------------------------------------------
    // Step 3: Direct User Role Promotion & Demotion by Admin
    // ------------------------------------------------------------------------
    console.log('\n[STEP 3] Testing direct user role promotion/demotion...');
    const uniqueEmail = `testrbac${Date.now()}@example.com`;
    const custSub = `subrbac${Date.now()}`;
    const custMockToken = `MOCK_GOOGLE_${custSub}_${uniqueEmail}_DirectRoleUser`;
    const regRes = await fetch(`${BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: custMockToken }),
    });
    assert.equal(regRes.status, 200, 'User setup via Google SSO failed');
    const regData = await regRes.json();
    assert.equal(regData.user.role, 'customer', 'New user must default to customer');

    // Admin searches for the user
    const userSearchRes = await fetch(`${BASE}/api/admin/users?search=${encodeURIComponent(uniqueEmail)}`, {
      headers: { cookie: adminCookie },
    });
    assert.equal(userSearchRes.status, 200);
    const searchData = await userSearchRes.json();
    assert.equal(searchData.users.length, 1);
    const testUserId = searchData.users[0].id;
    assert.ok(testUserId, 'User id must exist');

    // Admin promotes user directly to reseller
    console.log('  -> Admin promotes user to reseller...');
    const promoteRes = await fetch(`${BASE}/api/admin/users/${testUserId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ role: 'reseller' }),
    });
    assert.equal(promoteRes.status, 200);
    const promotedData = await promoteRes.json();
    assert.equal(promotedData.user.role, 'reseller');

    // Admin demotes user back to customer
    console.log('  -> Admin demotes user back to customer...');
    const demoteRes = await fetch(`${BASE}/api/admin/users/${testUserId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ role: 'customer' }),
    });
    assert.equal(demoteRes.status, 200);
    const demotedData = await demoteRes.json();
    assert.equal(demotedData.user.role, 'customer');

    // ------------------------------------------------------------------------
    // Step 4: Tokenized VIP WhatsApp Invite Generation & Claim
    // ------------------------------------------------------------------------
    console.log('\n[STEP 4] Testing VIP WhatsApp Invite Generation & Claim...');
    const partnerName = `Bengkel Racing Juara ${Date.now() % 1000}`;
    const createInviteRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        partnerName,
        roleToGrant: 'reseller',
        expiresInHours: 168,
      }),
    });
    assert.equal(createInviteRes.status, 201);
    const inviteData = await createInviteRes.json();
    const invite = inviteData.invite || inviteData;
    assert.ok(invite.token, 'Token must be generated');
    assert.equal(invite.token.length, 64, 'Token must be 64-char crypto hex');
    assert.equal(invite.partnerName, partnerName);
    const token = invite.token;
    console.log(`  -> Generated VIP invite token for "${partnerName}": ${token.slice(0, 12)}...`);

    // Public token validity inspection
    const infoRes = await fetch(`${BASE}/api/reseller/invite-info?token=${token}`);
    assert.equal(infoRes.status, 200);
    const infoData = await infoRes.json();
    assert.equal(infoData.valid, true);
    assert.equal(infoData.partnerName, partnerName);
    assert.equal(infoData.roleToGrant, 'reseller');

    // Reseller claims invite with fresh credentials
    console.log('  -> Reseller claims invite with fresh credentials (OWASP re-auth)...');
    const partnerEmail = `partner${Date.now()}@example.com`;
    const partnerSub = `subpartner${Date.now()}`;
    const partnerMockToken = `MOCK_GOOGLE_${partnerSub}_${partnerEmail}_PartnerVip`;
    const claimRes = await fetch(`${BASE}/api/reseller/claim-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        credential: partnerMockToken,
      }),
    });
    assert.equal(claimRes.status, 200, `Claim failed: ${claimRes.status}`);
    const claimData = await claimRes.json();
    assert.equal(claimData.user.role, 'reseller');
    assert.equal(claimData.user.email, partnerEmail);
    const partnerCookie = parseCookies(claimRes);
    assert.ok(partnerCookie, 'Session cookie must be issued upon claim');

    // Token should now be claimed and no longer valid for second use (HTTP 410 Gone)
    const reInfoRes = await fetch(`${BASE}/api/reseller/invite-info?token=${token}`);
    assert.equal(reInfoRes.status, 410, 'Claimed invite must return 410 Gone');

    // ------------------------------------------------------------------------
    // Step 5: Dynamic Reseller Wholesale Pricing Verification
    // ------------------------------------------------------------------------
    console.log('\n[STEP 5] Testing dynamic pricing differences between Guest and Reseller...');
    // Guest view
    const guestProductsRes = await fetch(`${BASE}/api/checkout/products`);
    assert.equal(guestProductsRes.status, 200);
    const guestData = await guestProductsRes.json();
    assert.ok(guestData.products.length > 0, 'Products catalog should not be empty');
    const sampleProductGuest = guestData.products[0];
    const guestDiscount = guestData.discountPercent ?? guestData.discount_percent ?? 0;
    console.log(`  -> Guest catalog price for "${sampleProductGuest.name}": Rp ${(sampleProductGuest.priceEffective ?? sampleProductGuest.price).toLocaleString('id-ID')} (Discount: ${guestDiscount}%)`);
    assert.equal(guestDiscount, 0, 'Guest discount must be 0%');

    // Reseller view
    const resellerProductsRes = await fetch(`${BASE}/api/checkout/products`, {
      headers: { cookie: partnerCookie },
    });
    assert.equal(resellerProductsRes.status, 200);
    const resellerData = await resellerProductsRes.json();
    const resellerDiscount = resellerData.discountPercent ?? resellerData.discount_percent ?? 0;
    assert.equal(resellerDiscount, 20, 'Reseller discount must be 20%');
    assert.equal(resellerData.isResellerPricing, true, 'Reseller isResellerPricing must be true');
    const sampleProductReseller = resellerData.products[0];
    console.log(`  -> Reseller catalog price for "${sampleProductReseller.name}": Rp ${(sampleProductReseller.priceEffective ?? sampleProductReseller.price).toLocaleString('id-ID')} (Original: Rp ${(sampleProductReseller.priceRetail ?? sampleProductReseller.original_price).toLocaleString('id-ID')})`);
    const expectedDiscounted = Math.round(sampleProductGuest.priceRetail * 0.8);
    assert.equal(sampleProductReseller.priceEffective, expectedDiscounted, 'Product price must reflect 20% wholesale discount');

    // ------------------------------------------------------------------------
    // Step 6: Revocation of Active Invite
    // ------------------------------------------------------------------------
    console.log('\n[STEP 6] Testing Admin Revoke Invite Token...');
    const revokeTargetInviteRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        partnerName: 'Temporary Invite',
        roleToGrant: 'reseller',
        expiresInHours: 24,
      }),
    });
    assert.equal(revokeTargetInviteRes.status, 201);
    const revokeTargetData = await revokeTargetInviteRes.json();
    const revokeTarget = revokeTargetData.invite || revokeTargetData;
    const revokeToken = revokeTarget.token;
    const inviteId = revokeTarget.id;

    // Revoke
    const doRevoke = await fetch(`${BASE}/api/admin/reseller-invites/${inviteId}/revoke`, {
      method: 'POST',
      headers: { cookie: adminCookie },
    });
    assert.equal(doRevoke.status, 200);

    // Verify lookup reports revoked (HTTP 410 Gone)
    const checkRevoked = await fetch(`${BASE}/api/reseller/invite-info?token=${revokeToken}`);
    assert.equal(checkRevoked.status, 410, 'Revoked token must return 410 Gone');
    console.log('  -> Token successfully revoked and rejected by API.');

    console.log('\n🎉 ========================================================');
    console.log('🎉 [E2E PASSED] ALL 6 LIFECYCLE PHASES VERIFIED SUCCESSFULLY!');
    console.log('🎉 ========================================================');
  } finally {
    if (spawnedServer) {
      spawnedServer.kill();
    }
  }
}

main().catch((err) => {
  console.error('\n❌ [E2E FAILED]:', err);
  if (spawnedServer) spawnedServer.kill();
  process.exit(1);
});
