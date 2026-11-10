import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../../backend');

const BASE = process.env.BASE_URL ?? 'http://localhost:4000';
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

try {
  console.log('\n======================================================');
  console.log('--- TEST SUITE: Decoupled Pricing Engine (TDD) ---');
  console.log('======================================================');

  dbClient = await getPgClient();

  // Clean up any lingering temporary policies
  await dbClient.query(`DELETE FROM master.t_mtr_discount_policies WHERE code = 'DEPOK_SPECIAL_10'`);

  // Verify baseline decoupled policies exist
  const basePoliciesRes = await dbClient.query(`
    SELECT code, discount_value, stacking_mode, is_active 
    FROM master.t_mtr_discount_policies 
    WHERE code IN ('RESELLER_BASE_20', 'DISTRIBUTOR_TIER_35')
  `);
  const codes = basePoliciesRes.rows.map((r) => r.code);
  assert.ok(codes.includes('RESELLER_BASE_20'), 'RESELLER_BASE_20 policy must exist in DB');
  assert.ok(codes.includes('DISTRIBUTOR_TIER_35'), 'DISTRIBUTOR_TIER_35 policy must exist in DB');
  console.log('[PASS] Baseline discount policies confirmed in master.t_mtr_discount_policies.');

  await ensureServer();

  // Setup test users & sessions
  console.log('\n--- Setting up test sessions (Customer, Reseller, Distributor) ---');
  
  // 1. Customer user
  const custSub = `sub-cust-dec-${Date.now()}`;
  const custEmail = `cust-dec-${Date.now()}@test.local`;
  const custLoginRes = await fetch(`${BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: `MOCK_GOOGLE_${custSub}_${custEmail}_CustDec` }),
  });
  assert.equal(custLoginRes.status, 200);
  const custCookie = getCookie(custLoginRes);

  // 2. Reseller user
  const resSub = `sub-reseller-dec-${Date.now()}`;
  const resEmail = `reseller-dec-${Date.now()}@test.local`;
  const resLoginRes = await fetch(`${BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: `MOCK_GOOGLE_${resSub}_${resEmail}_ResDec` }),
  });
  assert.equal(resLoginRes.status, 200);
  const resCookie = getCookie(resLoginRes);
  const resUserDb = await dbClient.query(`SELECT id FROM master.t_mtr_users WHERE email = $1`, [resEmail]);
  await dbClient.query(`UPDATE master.t_mtr_users SET role = 'reseller' WHERE id = $1`, [resUserDb.rows[0].id]);

  // 3. Distributor user
  const distSub = `sub-dist-dec-${Date.now()}`;
  const distEmail = `dist-dec-${Date.now()}@test.local`;
  const distLoginRes = await fetch(`${BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: `MOCK_GOOGLE_${distSub}_${distEmail}_DistDec` }),
  });
  assert.equal(distLoginRes.status, 200);
  const distCookie = getCookie(distLoginRes);
  const distUserDb = await dbClient.query(`SELECT id FROM master.t_mtr_users WHERE email = $1`, [distEmail]);
  await dbClient.query(`UPDATE master.t_mtr_users SET role = 'distributor' WHERE id = $1`, [distUserDb.rows[0].id]);

  console.log('[PASS] Test sessions established: Guest, Customer, Reseller, Distributor.');

  // ---------------------------------------------------------
  // TEST 1: Guest/Customer user receives 0% discount (Retail)
  // ---------------------------------------------------------
  console.log('\n--- [TEST 1] Verifying 0% discount for Guest & Customer (Retail Pricing) ---');
  {
    const guestRes = await fetch(`${BASE}/api/checkout/products`);
    assert.equal(guestRes.status, 200);
    const guestData = await guestRes.json();
    assert.equal(guestData.discountPercent, 0, `Guest discountPercent should be 0, got ${guestData.discountPercent}`);
    assert.equal(guestData.isResellerPricing, false);
    const p = guestData.products.find((prod) => prod.id === 'kdv2-vario125');
    assert.ok(p, 'Product kdv2-vario125 missing in catalog');
    assert.equal(p.priceRetail, 1850000);
    assert.equal(p.priceEffective, 1850000);
    assert.equal(p.discountPercent, 0);

    // Customer
    const custRes = await fetch(`${BASE}/api/checkout/products`, { headers: { cookie: custCookie } });
    assert.equal(custRes.status, 200);
    const custData = await custRes.json();
    assert.equal(custData.discountPercent, 0);
    assert.equal(custData.isResellerPricing, false);
    const cp = custData.products.find((prod) => prod.id === 'kdv2-vario125');
    assert.equal(cp.priceEffective, 1850000);
    console.log('[PASS] Test 1: Guest and Customer received 0% discount (Retail 1,850,000 IDR).');
  }

  // ---------------------------------------------------------
  // TEST 2: Reseller user receives 20% discount via RESELLER_BASE_20
  // ---------------------------------------------------------
  console.log('\n--- [TEST 2] Verifying 20% discount for Reseller via RESELLER_BASE_20 ---');
  {
    const resRes = await fetch(`${BASE}/api/checkout/products`, { headers: { cookie: resCookie } });
    assert.equal(resRes.status, 200);
    const resData = await resRes.json();
    assert.equal(resData.discountPercent, 20, `Reseller discountPercent should be 20, got ${resData.discountPercent}`);
    assert.equal(resData.isResellerPricing, true);
    assert.ok(
      Array.isArray(resData.matchedPolicies) && resData.matchedPolicies.includes('RESELLER_BASE_20'),
      `matchedPolicies must include RESELLER_BASE_20, got: ${JSON.stringify(resData.matchedPolicies)}`,
    );
    const p = resData.products.find((prod) => prod.id === 'kdv2-vario125');
    assert.equal(p.priceRetail, 1850000);
    assert.equal(p.priceEffective, 1480000, `Reseller priceEffective should be 1,480,000 IDR, got ${p.priceEffective}`);
    assert.equal(p.discountPercent, 20);
    console.log('[PASS] Test 2: Reseller received 20% discount via RESELLER_BASE_20 (1,480,000 IDR).');
  }

  // ---------------------------------------------------------
  // TEST 3: Distributor user receives 35% discount via DISTRIBUTOR_TIER_35
  // ---------------------------------------------------------
  console.log('\n--- [TEST 3] Verifying 35% discount for Distributor via DISTRIBUTOR_TIER_35 ---');
  {
    const distRes = await fetch(`${BASE}/api/checkout/products`, { headers: { cookie: distCookie } });
    assert.equal(distRes.status, 200);
    const distData = await distRes.json();
    assert.equal(distData.discountPercent, 35, `Distributor discountPercent should be 35, got ${distData.discountPercent}`);
    assert.equal(distData.isResellerPricing, true);
    assert.ok(
      Array.isArray(distData.matchedPolicies) && distData.matchedPolicies.includes('DISTRIBUTOR_TIER_35'),
      `matchedPolicies must include DISTRIBUTOR_TIER_35, got: ${JSON.stringify(distData.matchedPolicies)}`,
    );
    const p = distData.products.find((prod) => prod.id === 'kdv2-vario125');
    assert.equal(p.priceRetail, 1850000);
    assert.equal(p.priceEffective, 1202500, `Distributor priceEffective should be 1,202,500 IDR, got ${p.priceEffective}`);
    assert.equal(p.discountPercent, 35);
    console.log('[PASS] Test 3: Distributor received 35% discount via DISTRIBUTOR_TIER_35 (1,202,500 IDR).');
  }

  // ---------------------------------------------------------
  // TEST 4: Dynamic City Scope (DEPOK_SPECIAL_10)
  // ---------------------------------------------------------
  console.log('\n--- [TEST 4] Verifying Dynamic City Scoping with policy DEPOK_SPECIAL_10 ---');
  {
    // Insert temporary policy
    await dbClient.query(`
      INSERT INTO master.t_mtr_discount_policies (
        code, name, discount_type, discount_value, criteria_rules, priority, is_active, stacking_mode
      ) VALUES (
        'DEPOK_SPECIAL_10',
        'Promo Khusus Kota Depok',
        'PERCENTAGE',
        10.00,
        '{"cities": ["KOTA_DEPOK"]}'::jsonb,
        5,
        true,
        'EXCLUSIVE'
      )
    `);

    try {
      // 4a. Request with ?city=KOTA_DEPOK as Guest -> effective discount 10%
      const depokRes = await fetch(`${BASE}/api/checkout/products?city=KOTA_DEPOK`);
      assert.equal(depokRes.status, 200);
      const depokData = await depokRes.json();
      assert.equal(depokData.discountPercent, 10, `Expected 10% for KOTA_DEPOK, got ${depokData.discountPercent}`);
      assert.ok(
        Array.isArray(depokData.matchedPolicies) && depokData.matchedPolicies.includes('DEPOK_SPECIAL_10'),
        `matchedPolicies should contain DEPOK_SPECIAL_10, got: ${JSON.stringify(depokData.matchedPolicies)}`,
      );
      const depokProd = depokData.products.find((prod) => prod.id === 'kdv2-vario125');
      assert.equal(
        depokProd.priceEffective,
        1665000,
        `Expected 1,665,000 IDR (10% off 1,850,000), got ${depokProd.priceEffective}`,
      );

      // 4b. Request with ?city=kota_depok (case-insensitive test) via alias /api/products
      const depokLowerRes = await fetch(`${BASE}/api/products?city=kota_depok`);
      assert.equal(depokLowerRes.status, 200);
      const depokLowerData = await depokLowerRes.json();
      assert.equal(depokLowerData.discountPercent, 10, 'Should match case-insensitively');
      const depokLowerProd = depokLowerData.products.find((prod) => prod.id === 'kdv2-vario125');
      assert.equal(depokLowerProd.priceEffective, 1665000);

      // 4c. Request with ?city=KOTA_BANDUNG -> effective discount 0%
      const bandungRes = await fetch(`${BASE}/api/checkout/products?city=KOTA_BANDUNG`);
      assert.equal(bandungRes.status, 200);
      const bandungData = await bandungRes.json();
      assert.equal(bandungData.discountPercent, 0, `Expected 0% for KOTA_BANDUNG, got ${bandungData.discountPercent}`);
      const bandungProd = bandungData.products.find((prod) => prod.id === 'kdv2-vario125');
      assert.equal(bandungProd.priceEffective, 1850000);

      // 4d. Request without city -> effective discount 0%
      const noCityRes = await fetch(`${BASE}/api/checkout/products`);
      assert.equal(noCityRes.status, 200);
      const noCityData = await noCityRes.json();
      assert.equal(noCityData.discountPercent, 0, `Expected 0% without city, got ${noCityData.discountPercent}`);
      const noCityProd = noCityData.products.find((prod) => prod.id === 'kdv2-vario125');
      assert.equal(noCityProd.priceEffective, 1850000);

      console.log('[PASS] Test 4: City scoping correctly matches KOTA_DEPOK (10%) and ignores KOTA_BANDUNG / no-city.');
    } finally {
      // Ensure temporary policy is deleted
      await dbClient.query(`DELETE FROM master.t_mtr_discount_policies WHERE code = 'DEPOK_SPECIAL_10'`);
    }
  }

  // ---------------------------------------------------------
  // TEST 5: Stripe session creation with dynamic discounts and policy metadata
  // ---------------------------------------------------------
  console.log('\n--- [TEST 5] Verifying Stripe Checkout with decoupled discount & metadata ---');
  {
    // Re-insert temporary policy for Stripe test
    await dbClient.query(`
      INSERT INTO master.t_mtr_discount_policies (
        code, name, discount_type, discount_value, criteria_rules, priority, is_active, stacking_mode
      ) VALUES (
        'DEPOK_SPECIAL_10',
        'Promo Khusus Kota Depok',
        'PERCENTAGE',
        10.00,
        '{"cities": ["KOTA_DEPOK"]}'::jsonb,
        5,
        true,
        'EXCLUSIVE'
      )
    `);

    try {
      // 5a. Guest in KOTA_DEPOK (10% discount -> 1,665,000 IDR)
      const depokStripeRes = await fetch(`${BASE}/api/checkout/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'kdv2-vario125',
          city: 'KOTA_DEPOK',
          name: 'Pelanggan Depok',
          email: 'depok@test.local',
          phone: '081211112222',
        }),
      });
      assert.equal(depokStripeRes.status, 200, `Stripe checkout failed: status ${depokStripeRes.status}`);
      const depokStripeData = await depokStripeRes.json();
      assert.ok(depokStripeData.url);
      assert.equal(depokStripeData.amount, 1665000, `Expected 1,665,000 IDR for Depok guest, got ${depokStripeData.amount}`);
      assert.equal(depokStripeData.discountPercent, 10);
      assert.ok(
        Array.isArray(depokStripeData.matchedPolicies) && depokStripeData.matchedPolicies.includes('DEPOK_SPECIAL_10'),
        `Expected matchedPolicies in response to include DEPOK_SPECIAL_10, got: ${JSON.stringify(depokStripeData.matchedPolicies)}`,
      );

      // 5b. Reseller checkout (20% discount via RESELLER_BASE_20 -> 1,480,000 IDR)
      const resStripeRes = await fetch(`${BASE}/api/checkout/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: resCookie },
        body: JSON.stringify({
          productId: 'kdv2-vario125',
          name: 'Reseller Speed Shop',
          email: resEmail,
          phone: '081299887766',
        }),
      });
      assert.equal(resStripeRes.status, 200);
      const resStripeData = await resStripeRes.json();
      assert.equal(resStripeData.amount, 1480000, `Expected 1,480,000 IDR for reseller, got ${resStripeData.amount}`);
      assert.equal(resStripeData.discountPercent, 20);
      assert.ok(
        Array.isArray(resStripeData.matchedPolicies) && resStripeData.matchedPolicies.includes('RESELLER_BASE_20'),
        `Expected matchedPolicies in response to include RESELLER_BASE_20, got: ${JSON.stringify(resStripeData.matchedPolicies)}`,
      );

      // 5c. Distributor checkout (35% discount via DISTRIBUTOR_TIER_35 -> 1,202,500 IDR)
      const distStripeRes = await fetch(`${BASE}/api/checkout/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: distCookie },
        body: JSON.stringify({
          productId: 'kdv2-vario125',
          name: 'Distributor Regional',
          email: distEmail,
          phone: '081233445566',
        }),
      });
      assert.equal(distStripeRes.status, 200);
      const distStripeData = await distStripeRes.json();
      assert.equal(distStripeData.amount, 1202500, `Expected 1,202,500 IDR for distributor, got ${distStripeData.amount}`);
      assert.equal(distStripeData.discountPercent, 35);
      assert.ok(
        Array.isArray(distStripeData.matchedPolicies) && distStripeData.matchedPolicies.includes('DISTRIBUTOR_TIER_35'),
        `Expected matchedPolicies in response to include DISTRIBUTOR_TIER_35, got: ${JSON.stringify(distStripeData.matchedPolicies)}`,
      );

      console.log('[PASS] Test 5: Stripe checkout reflects decoupled discounts and records policy metadata.');
    } finally {
      // Clean up temporary policy
      await dbClient.query(`DELETE FROM master.t_mtr_discount_policies WHERE code = 'DEPOK_SPECIAL_10'`);
    }
  }

  console.log('\n======================================================');
  console.log('SUCCESS: All Decoupled Pricing Engine tests passed 100%!');
  console.log('======================================================\n');
} finally {
  if (dbClient) {
    try {
      await dbClient.query(`DELETE FROM master.t_mtr_discount_policies WHERE code = 'DEPOK_SPECIAL_10'`);
      await dbClient.end();
    } catch {}
  }
  await cleanup();
}
