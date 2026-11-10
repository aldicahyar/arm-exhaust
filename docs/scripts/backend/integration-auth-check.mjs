// backend/scripts/integration-auth-check.mjs
// Test integrasi auth:
// 1. Login normal admin (email + password).
// 2. Google Login user baru (mock token):
//    - Membuat user di master.t_mtr_users (role customer, password_hash null).
//    - Membuat record identitas di master.t_mtr_user_identities.
//    - Membuat session di transaction.t_trx_sessions.
// 3. User existing email (register email dulu, lalu google login email sama):
//    - Menautkan provider_user_id ke master.t_mtr_user_identities tanpa menduplikasi master.t_mtr_users.
// 4. User Google-only mencoba login email & password:
//    - Harus ditolak 401 secara aman tanpa 500 error.
// 5. User yang sudah linked login Google lagi:
//    - Tetap berhasil login dan membuat session baru.

import assert from 'node:assert/strict';
import pg from 'pg';

const BASE = process.env.BASE_URL ?? 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@armexhaust.id';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin12345';

const dbClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
await dbClient.connect();

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

async function post(path, body, cookie) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

try {
  console.log('--- 1. Test Login Normal Admin ---');
  const adminRes = await post('/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  assert.equal(adminRes.status, 200, `Login admin gagal: status ${adminRes.status}`);
  const adminData = await adminRes.json();
  assert.equal(adminData.user.role, 'admin');
  assert.equal(adminData.user.email, ADMIN_EMAIL);
  const adminCookie = getCookie(adminRes);
  assert.ok(adminCookie?.startsWith('arm_session='), 'Cookie arm_session tidak diterima saat login admin');

  // Cek /me dengan cookie admin
  const adminMe = await fetch(`${BASE}/api/auth/me`, { headers: { cookie: adminCookie } });
  assert.equal(adminMe.status, 200);
  assert.equal((await adminMe.json()).user.role, 'admin');
  console.log('✓ Login normal admin lolos');

  console.log('--- 2. Test Login Google User Baru ---');
  const googleSub1 = `g-sub-${Date.now()}`;
  const googleEmail1 = `newgoogle-${Date.now()}@gmail.com`;
  const googleName1 = 'New Google Customer';
  const mockToken1 = `MOCK_GOOGLE_${googleSub1}_${googleEmail1}_${encodeURIComponent(googleName1)}`;

  const gNewRes = await post('/api/auth/google', { idToken: mockToken1 });
  assert.equal(gNewRes.status, 200, `Google login user baru gagal: ${gNewRes.status}`);
  const gNewData = await gNewRes.json();
  assert.equal(gNewData.user.email, googleEmail1);
  assert.equal(gNewData.user.role, 'customer');

  const gNewCookie = getCookie(gNewRes);
  assert.ok(gNewCookie?.startsWith('arm_session='), 'Cookie sesi Google user baru tidak diterima');

  // Verifikasi ke database:
  // a. master.t_mtr_users
  const user1Rows = (await dbClient.query('SELECT * FROM master.t_mtr_users WHERE email = $1', [googleEmail1])).rows;
  assert.equal(user1Rows.length, 1, 'User baru harus ada di master.t_mtr_users');
  assert.equal(user1Rows[0].password_hash, null, 'User baru Google-only harus memiliki password_hash NULL');
  assert.equal(user1Rows[0].role, 'customer');
  const user1Id = user1Rows[0].id;

  // b. master.t_mtr_user_identities
  const id1Rows = (await dbClient.query('SELECT * FROM master.t_mtr_user_identities WHERE user_id = $1', [user1Id])).rows;
  assert.equal(id1Rows.length, 1, 'Harus ada 1 identity di master.t_mtr_user_identities');
  assert.equal(id1Rows[0].provider, 'google');
  assert.equal(id1Rows[0].provider_user_id, googleSub1);

  // c. transaction.t_trx_sessions
  const sess1Rows = (await dbClient.query('SELECT * FROM transaction.t_trx_sessions WHERE user_id = $1', [user1Id])).rows;
  assert.ok(sess1Rows.length >= 1, 'Harus ada sesi di transaction.t_trx_sessions');
  console.log('✓ Google user baru tersimpan di users, identities, dan sessions');

  console.log('--- 3. Test Linking Akun: Existing Email lalu Google Login ---');
  const linkEmail = `link-${Date.now()}@example.com`;
  const linkPassword = 'LinkedPass123!';
  const linkName = 'Linked User';

  // Registrasi manual via email & password
  const regRes = await post('/api/auth/register', {
    name: linkName,
    email: linkEmail,
    password: linkPassword,
  });
  assert.equal(regRes.status, 200, `Register manual gagal: ${regRes.status}`);

  // Cek user terdaftar dengan password_hash
  const userRegRows = (await dbClient.query('SELECT * FROM master.t_mtr_users WHERE email = $1', [linkEmail])).rows;
  assert.equal(userRegRows.length, 1);
  const linkedUserId = userRegRows[0].id;
  assert.ok(userRegRows[0].password_hash !== null, 'User email biasa harus memiliki password_hash');

  // Login via Google dengan email yang sama
  const googleSub2 = `g-sub-linked-${Date.now()}`;
  const mockToken2 = `MOCK_GOOGLE_${googleSub2}_${linkEmail}_GoogleLinked`;
  const gLinkRes = await post('/api/auth/google', { idToken: mockToken2 });
  assert.equal(gLinkRes.status, 200, `Google login untuk linking akun gagal: ${gLinkRes.status}`);
  const gLinkData = await gLinkRes.json();
  assert.equal(gLinkData.user.email, linkEmail);

  // Pastikan user di master.t_mtr_users TIDAK bertambah ganda
  const usersAfterLink = (await dbClient.query('SELECT * FROM master.t_mtr_users WHERE email = $1', [linkEmail])).rows;
  assert.equal(usersAfterLink.length, 1, 'Jumlah user tidak boleh ganda setelah linking');
  assert.equal(usersAfterLink[0].id, linkedUserId, 'ID user harus tetap sama');

  // Pastikan identitas Google tertaut ke linkedUserId
  const idLinkRows = (await dbClient.query(
    'SELECT * FROM master.t_mtr_user_identities WHERE user_id = $1 AND provider = $2',
    [linkedUserId, 'google'],
  )).rows;
  assert.equal(idLinkRows.length, 1, 'Harus tertaut di master.t_mtr_user_identities');
  assert.equal(idLinkRows[0].provider_user_id, googleSub2);
  console.log('✓ Linking akun existing email ke Google identities berhasil tanpa duplikasi');

  console.log('--- 4. Test User Google-only Login Email & Password (Harus 401 tanpa 500) ---');
  const gOnlyLoginRes = await post('/api/auth/login', {
    email: googleEmail1,
    password: 'anypassword',
  });
  assert.equal(gOnlyLoginRes.status, 401, `Google-only login email/password harus 401, got: ${gOnlyLoginRes.status}`);
  const gOnlyData = await gOnlyLoginRes.json();
  assert.equal(gOnlyData.error, 'Email atau password salah.');
  console.log('✓ User Google-only ditolak 401 dengan aman tanpa 500 error');

  console.log('--- 5. Test User Linked Login Google Kembali ---');
  const gSub2LoginRes = await post('/api/auth/google', { idToken: mockToken2 });
  assert.equal(gSub2LoginRes.status, 200);
  const gSub2Cookie = getCookie(gSub2LoginRes);
  const meRes = await fetch(`${BASE}/api/auth/me`, { headers: { cookie: gSub2Cookie } });
  assert.equal(meRes.status, 200);
  assert.equal((await meRes.json()).user.email, linkEmail);
  console.log('✓ Login Google ulang untuk user yang sudah tertaut berhasil');

  console.log('--- 6. Test Kebijakan Password Register (Server-side) ---');
  const policyEmail = () => `policy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  const rejections = [
    ['Short1!', 'Password must be at least 8 characters.'],
    ['alllower1!', 'Password must contain an uppercase letter (A-Z).'],
    ['ALLUPPER1!', 'Password must contain a lowercase letter (a-z).'],
    ['NoDigits!!', 'Password must contain a number (0-9).'],
    ['NoSpecial11', 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).'],
  ];
  for (const [weakPw, expectedError] of rejections) {
    const r = await post('/api/auth/register', { name: 'Policy Test', email: policyEmail(), password: weakPw });
    assert.equal(r.status, 400, `"${weakPw}" harus ditolak 400`);
    assert.equal((await r.json()).error, expectedError, `"${weakPw}" → pesan spesifik`);
  }
  const okReg = await post('/api/auth/register', {
    name: 'Policy Test', email: policyEmail(), password: 'Str0ng!Pass',
  });
  assert.equal(okReg.status, 200, 'password compliant harus diterima');
  console.log('✓ Server menolak 5 kategori password lemah & menerima password kuat');

  console.log('=== SEMUA TEST INTEGRASI AUTH LOLOS ===');
} finally {
  await dbClient.end();
}
