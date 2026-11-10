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

async function getPgClient() {
  const pgPath = (await import('node:url')).pathToFileURL(
    path.resolve(backendDir, 'node_modules/pg/lib/index.js'),
  ).href;
  const { default: pg } = await import(pgPath);
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  return client;
}

async function resetRateLimits() {
  try {
    const client = await getPgClient();
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
    console.log(`[INFO] Backend server already running at ${BASE}`);
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

console.log('🏁 === [E2E] Full Lifecycle Decoupled Discount Policies Verification === 🏁\n');

await resetRateLimits();
await ensureServer();

const client = await getPgClient();

try {
  // -------------------------------------------------------------
  // Step 1: Admin Authentication & Roles Endpoint Verification
  // -------------------------------------------------------------
  console.log('--- [1/6] Admin Login & Role Catalog Verification ---');
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.equal(loginRes.status, 200, 'Admin login must succeed with 200 OK');
  const adminCookie = getCookie(loginRes);
  assert.ok(adminCookie, 'Admin session cookie must be set');

  const rolesRes = await fetch(`${BASE}/api/admin/roles`, {
    headers: { Cookie: adminCookie },
  });
  assert.equal(rolesRes.status, 200, 'GET /api/admin/roles must return 200 OK');
  const roles = await rolesRes.json();
  assert.ok(Array.isArray(roles) && roles.length >= 3, 'Must return at least 3 roles');
  const roleIds = roles.map((r) => r.id);
  assert.ok(roleIds.includes('customer'), 'Roles must include customer');
  assert.ok(roleIds.includes('reseller'), 'Roles must include reseller');
  assert.ok(roleIds.includes('distributor'), 'Roles must include distributor');
  console.log('✅ Admin login & decoupled master roles verified.');

  // -------------------------------------------------------------
  // Step 2: Guest Catalog Pricing (Zero Discount Base)
  // -------------------------------------------------------------
  console.log('\n--- [2/6] Guest Catalog Pricing (Retail Pricing) ---');
  const guestCatRes = await fetch(`${BASE}/api/checkout/products`);
  assert.equal(guestCatRes.status, 200, 'Guest catalog should return 200 OK');
  const guestCat = await guestCatRes.json();
  assert.equal(guestCat.discountPercent, 0, 'Guest discountPercent must be 0%');
  assert.equal(guestCat.isResellerPricing, false, 'Guest isResellerPricing must be false');
  const guestBaseProd = guestCat.products.find((p) => p.id === 'kdv2-vario125');
  assert.ok(guestBaseProd, 'Product kdv2-vario125 must exist');
  assert.equal(guestBaseProd.priceRetail, 1850000, 'Retail price must be 1,850,000 IDR');
  assert.equal(guestBaseProd.priceEffective, 1850000, 'Effective price must equal retail price for guest');
  console.log('✅ Guest retail pricing verified (0% discount, 1.850.000 IDR).');

  // -------------------------------------------------------------
  // Step 3: Dynamic City-Level Policy Evaluation
  // -------------------------------------------------------------
  console.log('\n--- [3/6] Dynamic City Scoping Evaluation ---');
  const testPolicyCode = 'E2E_DEPOK_PROMO_15';
  await client.query(`
    INSERT INTO master.t_mtr_discount_policies (
      code, name, discount_type, discount_value, criteria_rules, priority, is_active
    ) VALUES (
      $1, 'Promo Regional Depok', 'PERCENTAGE', 15.00, '{"cities": ["KOTA_DEPOK"]}'::jsonb, 5, TRUE
    ) ON CONFLICT (code) DO UPDATE SET discount_value = 15.00, criteria_rules = '{"cities": ["KOTA_DEPOK"]}'::jsonb, is_active = TRUE;
  `, [testPolicyCode]);

  try {
    // Depok City Query -> Expect 15% discount
    const depokCatRes = await fetch(`${BASE}/api/checkout/products?city=KOTA_DEPOK`);
    assert.equal(depokCatRes.status, 200);
    const depokCat = await depokCatRes.json();
    assert.equal(depokCat.discountPercent, 15, 'Depok discountPercent must be 15%');
    const depokProd = depokCat.products.find((p) => p.id === 'kdv2-vario125');
    assert.equal(depokProd.priceEffective, 1572500, 'Depok price effective should be 1,572,500 IDR');

    // Bandung City Query -> Expect 0% discount (Depok promo does not apply)
    const bandungCatRes = await fetch(`${BASE}/api/checkout/products?city=KOTA_BANDUNG`);
    assert.equal(bandungCatRes.status, 200);
    const bandungCat = await bandungCatRes.json();
    assert.equal(bandungCat.discountPercent, 0, 'Bandung discountPercent must be 0%');

    console.log('✅ City-level scoping verified: KOTA_DEPOK matches (15%), other cities fall back to 0%.');
  } finally {
    await client.query('DELETE FROM master.t_mtr_discount_policies WHERE code = $1', [testPolicyCode]);
  }

  // -------------------------------------------------------------
  // Step 4: Admin Creates Reseller Invite & Token Verification
  // -------------------------------------------------------------
  console.log('\n--- [4/6] VIP Reseller Invite Generation & Decoupled Policy Resolution ---');
  const createInviteRes = await fetch(`${BASE}/api/admin/reseller-invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      partnerName: 'Bengkel Speed Motorsport',
      partnerPhone: '081299887766',
      roleToGrant: 'reseller',
      expiresInHours: 48,
    }),
  });
  assert.equal(createInviteRes.status, 201, 'Create invite must return 201 Created');
  const inviteData = await createInviteRes.json();
  const token = inviteData.token;
  assert.ok(token, 'Invite token must be generated');

  // Verify invite-info endpoint resolves policy discount (20%)
  const inviteInfoRes = await fetch(`${BASE}/api/reseller/invite-info?token=${token}`);
  assert.equal(inviteInfoRes.status, 200, 'Invite info must return 200 OK');
  const inviteInfo = await inviteInfoRes.json();
  assert.equal(inviteInfo.valid, true, 'Invite must be valid');
  assert.equal(inviteInfo.roleToGrant, 'reseller', 'roleToGrant must be reseller');
  assert.equal(inviteInfo.discount_percent, 20, 'discount_percent must resolve to 20% from RESELLER_BASE_20');
  console.log('✅ VIP Reseller invite created and verified with decoupled 20% margin policy.');

  // -------------------------------------------------------------
  // Step 5: Claim Invite & Reseller Session Verification
  // -------------------------------------------------------------
  console.log('\n--- [5/6] Claim Invite via Google SSO & Session Verification ---');
  const partnerEmail = `e2epolicy${Date.now()}@armexhaust.id`;
  const partnerSub = `sube2epolicy${Date.now()}`;
  const mockGoogleToken = `MOCK_GOOGLE_${partnerSub}_${partnerEmail}_Bengkel Speed`;

  const claimRes = await fetch(`${BASE}/api/reseller/claim-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      credential: mockGoogleToken,
    }),
  });
  assert.equal(claimRes.status, 200, 'Claim invite must return 200 OK');
  const resellerCookie = getCookie(claimRes);
  assert.ok(resellerCookie, 'Reseller session cookie must be set');

  // Check /api/auth/me for reseller
  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: resellerCookie },
  });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.user.role, 'reseller', 'User role must be reseller');
  assert.equal(meData.user.discount_percent, 20, 'User discount_percent must be 20%');
  assert.equal(meData.user.roleDetails.discount_percent, 20, 'roleDetails.discount_percent must be 20%');

  // Reseller Catalog Pricing
  const resellerCatRes = await fetch(`${BASE}/api/checkout/products`, {
    headers: { Cookie: resellerCookie },
  });
  assert.equal(resellerCatRes.status, 200);
  const resellerCat = await resellerCatRes.json();
  assert.equal(resellerCat.discountPercent, 20, 'Reseller catalog discountPercent must be 20%');
  assert.equal(resellerCat.isResellerPricing, true, 'isResellerPricing must be true');
  const resellerProd = resellerCat.products.find((p) => p.id === 'kdv2-vario125');
  assert.equal(resellerProd.priceEffective, 1480000, 'Effective price must be 1,480,000 IDR (20% off 1,850,000 IDR)');

  console.log('✅ VIP Reseller claim succeeded: session discount_percent = 20%, wholesale catalog = 1.480.000 IDR.');

  // -------------------------------------------------------------
  // Step 6: Stripe Checkout Session with Decoupled Policy
  // -------------------------------------------------------------
  console.log('\n--- [6/6] Stripe Checkout Session Creation & Policy Attribution ---');
  const stripeRes = await fetch(`${BASE}/api/checkout/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: resellerCookie,
    },
    body: JSON.stringify({
      productId: 'kdv2-vario125',
      kategori: 'Standard Racing',
      inlet: '38mm',
      saringan: 'Full',
      motor: 'Vario 125 Old (LED)',
      name: 'Owner Bengkel Speed',
      email: partnerEmail,
      phone: '081299887766',
      address: 'Jl. Margonda Raya No. 45, Depok',
    }),
  });
  assert.equal(stripeRes.status, 200, 'Stripe session creation must return 200 OK');
  const stripeData = await stripeRes.json();
  assert.ok(stripeData.sessionId, 'Stripe sessionId must be returned');
  assert.equal(stripeData.amount, 1480000, 'Stripe checkout amount must match discounted price (1,480,000 IDR)');
  assert.equal(stripeData.discountPercent, 20, 'Stripe discountPercent must be 20%');
  assert.equal(stripeData.isResellerPricing, true, 'Stripe isResellerPricing must be true');
  console.log(`✅ Stripe session created: ${stripeData.sessionId} (Amount: ${stripeData.amount} IDR, 20% OFF)`);

  // Clean up claimed test user
  await client.query('DELETE FROM master.t_mtr_users WHERE email = $1', [partnerEmail]);

  console.log('\n🏁 🎉 [SUCCESS] All Decoupled Discount Policies E2E Lifecycle Checks PASSED 100%! 🎉 🏁\n');
} finally {
  await client.end();
  if (spawnedServer) {
    spawnedServer.kill();
  }
}
