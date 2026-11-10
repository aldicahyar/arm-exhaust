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

try {
  console.log('\n======================================================');
  console.log('--- TEST SUITE: Dynamic Reseller Pricing Engine ---');
  console.log('======================================================');

  // 1. Unit Tests for calculatePrice helper
  console.log('\n--- [1/7] Unit testing calculatePrice() helper ---');
  const catalogModulePath = (await import('node:url')).pathToFileURL(
    path.resolve(backendDir, 'dist/features/checkout/products.catalog.js'),
  ).href;
  const { calculatePrice, PRODUCTS } = await import(catalogModulePath);
  
  const kdv2Product = PRODUCTS.find((p) => p.id === 'kdv2-vario125');
  assert.ok(kdv2Product, 'Product kdv2-vario125 not found');
  assert.equal(kdv2Product.priceValue, 1850000);

  // Unauthenticated / Retail (0% discount)
  const retailCalc = calculatePrice(kdv2Product, {}, 0);
  assert.equal(retailCalc.priceRetail, 1850000);
  assert.equal(retailCalc.priceEffective, 1850000);
  assert.equal(retailCalc.discountAmount, 0);
  assert.equal(retailCalc.discountPercent, 0);
  assert.equal(retailCalc.isResellerPricing, false);

  // Reseller wholesale (20% discount): 1,850,000 * 0.8 = 1,480,000
  const resellerCalc = calculatePrice(kdv2Product, {}, 20);
  assert.equal(resellerCalc.priceRetail, 1850000);
  assert.equal(resellerCalc.priceEffective, 1480000);
  assert.equal(resellerCalc.discountAmount, 370000);
  assert.equal(resellerCalc.discountPercent, 20);
  assert.equal(resellerCalc.isResellerPricing, true);

  // Distributor wholesale (35% discount): 1,850,000 * 0.65 = 1,202,500
  const distCalc = calculatePrice(kdv2Product, {}, 35);
  assert.equal(distCalc.priceRetail, 1850000);
  assert.equal(distCalc.priceEffective, 1202500);
  assert.equal(distCalc.discountAmount, 647500);
  assert.equal(distCalc.discountPercent, 35);
  assert.equal(distCalc.isResellerPricing, true);

  // Variant AddPrice Calculation: Kondoman V2 + Full System (+1,500,000 = 3,350,000 IDR) with 20% discount = 2,680,000 IDR
  const variantCalc = calculatePrice(kdv2Product, { kategori: 'Full System' }, 20);
  assert.equal(variantCalc.priceRetail, 3350000);
  assert.equal(variantCalc.priceEffective, 2680000);
  assert.equal(variantCalc.discountAmount, 670000);
  assert.equal(variantCalc.discountPercent, 20);
  assert.equal(variantCalc.isResellerPricing, true);

  console.log('[PASS] Unit assertions for calculatePrice() passed 100%.');

  // 2. Setup DB connection & ensure test roles exist
  console.log('\n--- [2/7] Seeding roles and preparing database ---');
  const dbClient = await getPgClient();

  // Ensure default roles
  await dbClient.query(`
    INSERT INTO master.t_mtr_roles (id, name, description, discount_percent, can_access_admin, can_access_b2b)
    VALUES 
      ('customer', 'Customer', 'Pembeli ritel reguler', 0.00, FALSE, FALSE),
      ('reseller', 'Reseller Official', 'Bengkel rekanan resmi B2B', 20.00, FALSE, TRUE),
      ('admin', 'Administrator', 'Pengelola sistem & inventori', 0.00, TRUE, TRUE)
    ON CONFLICT (id) DO UPDATE SET discount_percent = EXCLUDED.discount_percent;
  `);

  // Ensure custom distributor role (35% discount)
  await dbClient.query(`
    INSERT INTO master.t_mtr_roles (id, name, description, discount_percent, can_access_admin, can_access_b2b, badge_style)
    VALUES (
      'distributor',
      'Distributor Regional',
      'Distributor tier 1',
      35.00,
      FALSE,
      TRUE,
      '{"bg": "#121A24", "border": "#1E3A8A", "text": "#38BDF8"}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET discount_percent = 35.00;
  `);
  console.log('[PASS] Roles verified: customer (0%), reseller (20%), distributor (35%).');

  await ensureServer();

  // 3. Setup test sessions (Guest, Customer, Reseller, Distributor)
  console.log('\n--- [3/7] Setting up authenticated test sessions ---');
  
  // Create Customer
  const custSub = `sub-cust-price-${Date.now()}`;
  const custEmail = `cust-price-${Date.now()}@test.local`;
  const custLoginRes = await fetch(`${BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: `MOCK_GOOGLE_${custSub}_${custEmail}_CustomerUser` }),
  });
  assert.equal(custLoginRes.status, 200);
  const custCookie = getCookie(custLoginRes);
  const custMe = await (await fetch(`${BASE}/api/auth/me`, { headers: { cookie: custCookie } })).json();
  const custUserId = custMe.user.id;

  // Create Reseller
  const resSub = `sub-reseller-price-${Date.now()}`;
  const resEmail = `reseller-price-${Date.now()}@test.local`;
  const resLoginRes = await fetch(`${BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: `MOCK_GOOGLE_${resSub}_${resEmail}_ResellerUser` }),
  });
  assert.equal(resLoginRes.status, 200);
  const resCookie = getCookie(resLoginRes);
  const resMe = await (await fetch(`${BASE}/api/auth/me`, { headers: { cookie: resCookie } })).json();
  const resUserId = resMe.user.id;
  await dbClient.query(`UPDATE master.t_mtr_users SET role = 'reseller' WHERE id = $1`, [resUserId]);

  // Create Distributor
  const distSub = `sub-dist-price-${Date.now()}`;
  const distEmail = `dist-price-${Date.now()}@test.local`;
  const distLoginRes = await fetch(`${BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: `MOCK_GOOGLE_${distSub}_${distEmail}_DistributorUser` }),
  });
  assert.equal(distLoginRes.status, 200);
  const distCookie = getCookie(distLoginRes);
  const distMe = await (await fetch(`${BASE}/api/auth/me`, { headers: { cookie: distCookie } })).json();
  const distUserId = distMe.user.id;
  await dbClient.query(`UPDATE master.t_mtr_users SET role = 'distributor' WHERE id = $1`, [distUserId]);

  console.log('[PASS] Test sessions established: Guest (no cookie), Customer, Reseller, Distributor.');

  // 4. GET /api/checkout/products & GET /api/products - Unauthenticated & Customer
  console.log('\n--- [4/7] Verifying GET products for Unauthenticated & Customer (Full Retail) ---');
  
  // Unauthenticated via /api/checkout/products
  const guestProductsRes = await fetch(`${BASE}/api/checkout/products`);
  assert.equal(guestProductsRes.status, 200, `Expected 200 from GET /api/checkout/products, got ${guestProductsRes.status}`);
  const guestData = await guestProductsRes.json();
  const guestProducts = Array.isArray(guestData) ? guestData : guestData.products;
  assert.ok(Array.isArray(guestProducts), 'Expected products array in response');
  
  const guestKdv2 = guestProducts.find((p) => p.id === 'kdv2-vario125');
  assert.ok(guestKdv2, 'Product kdv2-vario125 not found in catalog');
  assert.equal(guestKdv2.priceRetail, 1850000, `Retail price should be 1,850,000 IDR, got ${guestKdv2.priceRetail}`);
  assert.equal(guestKdv2.priceEffective, 1850000, `Guest priceEffective should equal retail price, got ${guestKdv2.priceEffective}`);
  assert.equal(guestKdv2.discountPercent, 0, `Guest discountPercent should be 0, got ${guestKdv2.discountPercent}`);
  assert.equal(guestKdv2.isResellerPricing, false, `Guest isResellerPricing should be false`);

  // Unauthenticated via /api/products alias
  const aliasProductsRes = await fetch(`${BASE}/api/products`);
  assert.equal(aliasProductsRes.status, 200, `Expected 200 from GET /api/products, got ${aliasProductsRes.status}`);
  const aliasData = await aliasProductsRes.json();
  const aliasProducts = Array.isArray(aliasData) ? aliasData : aliasData.products;
  const aliasKdv2 = aliasProducts.find((p) => p.id === 'kdv2-vario125');
  assert.equal(aliasKdv2.priceRetail, 1850000);
  assert.equal(aliasKdv2.priceEffective, 1850000);

  // Customer (logged in but role = customer)
  const custProductsRes = await fetch(`${BASE}/api/checkout/products`, {
    headers: { cookie: custCookie },
  });
  assert.equal(custProductsRes.status, 200);
  const custData = await custProductsRes.json();
  const custProducts = Array.isArray(custData) ? custData : custData.products;
  const custKdv2 = custProducts.find((p) => p.id === 'kdv2-vario125');
  assert.equal(custKdv2.priceRetail, 1850000);
  assert.equal(custKdv2.priceEffective, 1850000);
  assert.equal(custKdv2.discountPercent, 0);
  assert.equal(custKdv2.isResellerPricing, false);
  console.log('[PASS] Unauthenticated and Customer users receive full retail pricing (1,850,000 IDR).');

  // 5. GET /api/checkout/products - Reseller (20% off: 1,480,000 IDR) & Distributor (35% off: 1,202,500 IDR)
  console.log('\n--- [5/7] Verifying GET /api/checkout/products dynamic discounts for Reseller & Distributor ---');
  
  // Reseller
  const resProductsRes = await fetch(`${BASE}/api/checkout/products`, {
    headers: { cookie: resCookie },
  });
  assert.equal(resProductsRes.status, 200);
  const resData = await resProductsRes.json();
  const resProducts = Array.isArray(resData) ? resData : resData.products;
  const resKdv2 = resProducts.find((p) => p.id === 'kdv2-vario125');
  assert.equal(resKdv2.priceRetail, 1850000);
  assert.equal(
    resKdv2.priceEffective,
    1480000,
    `Reseller (20% off) priceEffective should be 1,480,000 IDR, got ${resKdv2.priceEffective}`,
  );
  assert.equal(resKdv2.discountPercent, 20, `Reseller discountPercent should be 20, got ${resKdv2.discountPercent}`);
  assert.equal(resKdv2.isResellerPricing, true, 'Reseller isResellerPricing should be true');

  // Distributor
  const distProductsRes = await fetch(`${BASE}/api/checkout/products`, {
    headers: { cookie: distCookie },
  });
  assert.equal(distProductsRes.status, 200);
  const distData = await distProductsRes.json();
  const distProducts = Array.isArray(distData) ? distData : distData.products;
  const distKdv2 = distProducts.find((p) => p.id === 'kdv2-vario125');
  assert.equal(distKdv2.priceRetail, 1850000);
  assert.equal(
    distKdv2.priceEffective,
    1202500,
    `Distributor (35% off) priceEffective should be 1,202,500 IDR, got ${distKdv2.priceEffective}`,
  );
  assert.equal(distKdv2.discountPercent, 35, `Distributor discountPercent should be 35, got ${distKdv2.discountPercent}`);
  assert.equal(distKdv2.isResellerPricing, true, 'Distributor isResellerPricing should be true');
  console.log('[PASS] Dynamic discounts verified: Reseller = 1,480,000 IDR, Distributor = 1,202,500 IDR.');

  // 6. POST /api/checkout/stripe - Retail Checkout (Unauthenticated / Customer)
  console.log('\n--- [6/7] Verifying Stripe Checkout with Retail pricing ---');
  const guestStripeRes = await fetch(`${BASE}/api/checkout/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: 'kdv2-vario125',
      name: 'Budi Santoso',
      email: 'budi@test.local',
      phone: '08123456789',
    }),
  });
  assert.equal(guestStripeRes.status, 200, `Guest checkout failed: status ${guestStripeRes.status}`);
  const guestStripeData = await guestStripeRes.json();
  assert.ok(guestStripeData.url, 'Stripe session URL missing in guest checkout response');
  assert.equal(guestStripeData.amount, 1850000, `Expected Stripe amount 1,850,000 IDR, got ${guestStripeData.amount}`);
  assert.equal(guestStripeData.priceRetail, 1850000);
  assert.equal(guestStripeData.priceEffective, 1850000);
  assert.equal(guestStripeData.discountPercent, 0);
  assert.equal(guestStripeData.isResellerPricing, false);
  console.log('[PASS] Retail Stripe session created with full price: 1,850,000 IDR.');

  // 7. POST /api/checkout/stripe - Reseller & Distributor Wholesale Checkout
  console.log('\n--- [7/7] Verifying Stripe Checkout with Reseller & Distributor wholesale pricing ---');
  
  // Reseller checkout (20% off -> 1,480,000 IDR)
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
  assert.equal(resStripeRes.status, 200, `Reseller checkout failed: status ${resStripeRes.status}`);
  const resStripeData = await resStripeRes.json();
  assert.ok(resStripeData.url, 'Stripe session URL missing in reseller checkout');
  assert.equal(
    resStripeData.amount,
    1480000,
    `Reseller Stripe amount should be 1,480,000 IDR, got ${resStripeData.amount}`,
  );
  assert.equal(resStripeData.priceRetail, 1850000);
  assert.equal(resStripeData.priceEffective, 1480000);
  assert.equal(resStripeData.discountPercent, 20);
  assert.equal(resStripeData.isResellerPricing, true);

  // Distributor checkout (35% off -> 1,202,500 IDR)
  const distStripeRes = await fetch(`${BASE}/api/checkout/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: distCookie },
    body: JSON.stringify({
      productId: 'kdv2-vario125',
      name: 'Distributor Regional Jaya',
      email: distEmail,
      phone: '081233445566',
    }),
  });
  assert.equal(distStripeRes.status, 200, `Distributor checkout failed: status ${distStripeRes.status}`);
  const distStripeData = await distStripeRes.json();
  assert.ok(distStripeData.url, 'Stripe session URL missing in distributor checkout');
  assert.equal(
    distStripeData.amount,
    1202500,
    `Distributor Stripe amount should be 1,202,500 IDR, got ${distStripeData.amount}`,
  );
  assert.equal(distStripeData.priceRetail, 1850000);
  assert.equal(distStripeData.priceEffective, 1202500);
  assert.equal(distStripeData.discountPercent, 35);
  assert.equal(distStripeData.isResellerPricing, true);

  console.log('[PASS] Wholesale Stripe sessions created: Reseller = 1,480,000 IDR, Distributor = 1,202,500 IDR.');

  await dbClient.end();

  console.log('\n======================================================');
  console.log('SUCCESS: All Dynamic Pricing Engine tests passed 100%!');
  console.log('======================================================\n');
} finally {
  await cleanup();
}
