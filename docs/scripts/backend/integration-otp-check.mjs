// backend/scripts/integration-otp-check.mjs
// Komprehensif Integration Test untuk NestJS ARM Exhaust Backend:
// 1. Register normal -> returns { requiresOtp: true } tanpa session cookie.
// 2. Verify OTP salah berkali-kali hingga terkunci (423).
// 3. Verify OTP benar -> user masuk DB, session cookie diterbitkan.
// 4. OTP reuse -> ditolak 400 generik.
// 5. Login normal -> 200.
// 6. Admin config GET & PUT -> 200 dan verifikasi perubahan DB.
// 7. Non-admin PUT config -> 403.
// 8. Verifikasi PrismaService model query.

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../../backend/package.json', import.meta.url));
const pg = require('pg');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const cookieParser = require('cookie-parser');

const { AppModule } = await import('../../../backend/dist/app.module.js');
const { MailerService } = await import('../../../backend/dist/core/security/mailer.service.js');
const { DatabaseService } = await import('../../../backend/dist/core/database/database.service.js');
const { PrismaService } = await import('../../../backend/dist/core/prisma/prisma.service.js');

const TEST_PORT = 4005;
const BASE = `http://localhost:${TEST_PORT}`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@armexhaust.id';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin12345';

console.log('🚀 Memulai Bootstrapping NestJS Test Application pada port', TEST_PORT);

// Inisialisasi NestJS Application
const app = await NestFactory.create(AppModule, { logger: ['warn', 'error'] });
app.setGlobalPrefix('api');
app.use(cookieParser());
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
);

// Intercept MailerService untuk menangkap OTP yang dikirim secara otomatis
let lastCapturedOtp = null;
const mailerService = app.get(MailerService);
const originalSendOtp = mailerService.sendOtpEmail.bind(mailerService);
mailerService.sendOtpEmail = async (email, otp) => {
  lastCapturedOtp = otp;
  return originalSendOtp(email, otp);
};

await app.listen(TEST_PORT);
console.log(`✅ NestJS Test Application berhasil berjalan di ${BASE}/api`);

// Koneksi PG Client langsung untuk verifikasi database independen
const dbClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
await dbClient.connect();

// Search path default
await dbClient.query('SET search_path TO transaction, master');

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

async function get(path, cookie) {
  return fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
  });
}

async function put(path, body, cookie) {
  return fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

try {
  // Bersihkan record rate limit awal agar pengetesan fresh tanpa sisa blokir sesi sebelumnya
  await dbClient.query('DELETE FROM transaction.t_trx_rate_limits');

  // -------------------------------------------------------------
  // Skenario 1: Register normal -> requiresOtp: true tanpa session
  // -------------------------------------------------------------
  console.log('\n--- [1/8] Skenario 1: Register Normal ---');
  const user1Email = `test-user1-${Date.now()}@armexhaust.id`;
  const user1Pass = 'Password123!';
  const user1Name = 'Customer Satu';

  lastCapturedOtp = null;
  const reg1Res = await post('/api/auth/register', {
    name: user1Name,
    email: user1Email,
    password: user1Pass,
    captchaToken: 'dummy-bypass-token',
  });

  assert.equal(reg1Res.status, 200, `Register gagal: status ${reg1Res.status}`);
  const reg1Data = await reg1Res.json();
  assert.equal(reg1Data.requiresOtp, true, 'Response harus { requiresOtp: true }');

  const reg1Cookie = getCookie(reg1Res);
  assert.equal(reg1Cookie, null, 'Register TIDAK boleh menerbitkan session cookie');

  // Verifikasi di database: user belum masuk ke master.t_mtr_users
  const checkUser1 = await dbClient.query('SELECT * FROM master.t_mtr_users WHERE email = $1', [user1Email]);
  assert.equal(checkUser1.rows.length, 0, 'User belum boleh masuk t_mtr_users sebelum verifikasi OTP');

  // Verifikasi OTP tersimpan di transaction.t_trx_registration_otps
  const checkOtp1 = await dbClient.query('SELECT * FROM transaction.t_trx_registration_otps WHERE identifier = $1', [user1Email]);
  assert.equal(checkOtp1.rows.length, 1, 'Record OTP harus tersimpan di t_trx_registration_otps');
  assert.equal(checkOtp1.rows[0].verified_at, null, 'verified_at harus null');
  assert.ok(lastCapturedOtp, 'OTP harus tertangkap oleh mailer interceptor');
  assert.match(lastCapturedOtp, /^[0-9]{6}$/, 'OTP harus 6 digit angka');
  console.log('  ✓ Register normal mengembalikan { requiresOtp: true } tanpa cookie session');
  console.log('  ✓ Record OTP tersimpan di t_trx_registration_otps dan user belum masuk t_mtr_users');

  // -------------------------------------------------------------
  // Skenario 2: Verify OTP salah berkali-kali hingga terkunci (423)
  // -------------------------------------------------------------
  console.log('\n--- [2/8] Skenario 2: Verify OTP Salah Berkali-kali Hingga Terkunci (423) ---');
  const wrongOtp = lastCapturedOtp === '111111' ? '222222' : '111111';

  // Attempt 1
  const err1Res = await post('/api/auth/verify-otp', { email: user1Email, otp: wrongOtp });
  assert.equal(err1Res.status, 400, 'Attempt salah ke-1 harus status 400');

  // Attempt 2
  const err2Res = await post('/api/auth/verify-otp', { email: user1Email, otp: wrongOtp });
  assert.equal(err2Res.status, 400, 'Attempt salah ke-2 harus status 400');

  // Attempt 3 (Batas default otp.max_attempts adalah 3)
  const err3Res = await post('/api/auth/verify-otp', { email: user1Email, otp: wrongOtp });
  assert.equal(err3Res.status, 400, 'Attempt salah ke-3 harus status 400');

  // Verifikasi DB: locked_until harus sudah terisi
  const lockedRow = (await dbClient.query('SELECT attempts, locked_until FROM transaction.t_trx_registration_otps WHERE identifier = $1', [user1Email])).rows[0];
  assert.ok(lockedRow.attempts >= 3, 'Attempts harus >= 3');
  assert.ok(lockedRow.locked_until !== null, 'locked_until harus di-set');

  // Attempt ke-4: Harus ditolak dengan status 423 Locked!
  const lockRes = await post('/api/auth/verify-otp', { email: user1Email, otp: wrongOtp });
  assert.equal(lockRes.status, 423, `Harus terkunci dengan status 423, didapat: ${lockRes.status}`);
  const lockData = await lockRes.json();
  assert.match(lockData.message, /Too many failed attempts/i);
  console.log('  ✓ 3 kali percobaan salah mengunci OTP dan request berikutnya menghasilkan status 423 Locked');

  // -------------------------------------------------------------
  // Skenario 3: Verify OTP benar -> user masuk DB, session cookie
  // -------------------------------------------------------------
  console.log('\n--- [3/8] Skenario 3: Verify OTP Benar & Pembuatan Sesi ---');
  // Bersihkan record rate limit sebelum verifikasi OTP valid agar tidak terbentur sisa kuota percobaan salah
  await dbClient.query('DELETE FROM transaction.t_trx_rate_limits');

  const user2Email = `valid-customer-${Date.now()}@armexhaust.id`;
  const user2Pass = 'ValidPass123!';
  const user2Name = 'Customer Valid';

  lastCapturedOtp = null;
  const reg2Res = await post('/api/auth/register', {
    name: user2Name,
    email: user2Email,
    password: user2Pass,
    captchaToken: 'dummy-bypass-token',
  });
  assert.equal(reg2Res.status, 200);
  const correctOtp = lastCapturedOtp;
  assert.ok(correctOtp, 'Harus ada OTP valid untuk user2');

  const verifyRes = await post('/api/auth/verify-otp', {
    email: user2Email,
    otp: correctOtp,
  });
  assert.equal(verifyRes.status, 200, `Verifikasi OTP valid gagal: ${verifyRes.status}`);
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.user.email, user2Email);
  assert.equal(verifyData.user.name, user2Name);
  assert.equal(verifyData.user.role, 'customer');

  const customerCookie = getCookie(verifyRes);
  assert.ok(customerCookie?.startsWith('arm_session='), 'Cookie sesi arm_session harus diterbitkan');

  // Verifikasi user masuk master.t_mtr_users
  const user2Db = (await dbClient.query('SELECT * FROM master.t_mtr_users WHERE email = $1', [user2Email])).rows;
  assert.equal(user2Db.length, 1, 'User harus sudah tersimpan di master.t_mtr_users');
  assert.equal(user2Db[0].role, 'customer');

  // Verifikasi endpoint /api/auth/me mengembalikan user aktif
  const meRes = await get('/api/auth/me', customerCookie);
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.user.email, user2Email);
  console.log('  ✓ Verifikasi OTP benar berhasil membuat user customer di database dan menerbitkan cookie sesi');
  console.log('  ✓ Endpoint GET /api/auth/me mengonfirmasi autentikasi aktif dengan profil lengkap');

  // -------------------------------------------------------------
  // Skenario 4: OTP reuse -> ditolak 400 generik
  // -------------------------------------------------------------
  console.log('\n--- [4/8] Skenario 4: OTP Reuse Ditolak (Anti-Replay) ---');
  // Bersihkan record rate limit untuk IP pengujian agar tidak terbentur batasan frekuensi global
  await dbClient.query('DELETE FROM transaction.t_trx_rate_limits');

  const reuseRes = await post('/api/auth/verify-otp', {
    email: user2Email,
    otp: correctOtp,
  });
  assert.equal(reuseRes.status, 400, 'OTP reuse harus ditolak dengan status 400');
  const reuseData = await reuseRes.json();
  assert.equal(reuseData.message, 'OTP tidak valid atau kedaluwarsa.');
  console.log('  ✓ Penggunaan ulang OTP ditolak 400 dengan pesan generik anti-enumerasi');

  // -------------------------------------------------------------
  // Skenario 5: Login normal -> 200
  // -------------------------------------------------------------
  console.log('\n--- [5/8] Skenario 5: Login Normal Customer & Admin ---');
  const loginRes = await post('/api/auth/login', {
    email: user2Email,
    password: user2Pass,
    captchaToken: 'dummy-bypass-token',
  });
  assert.equal(loginRes.status, 200, `Login customer gagal: ${loginRes.status}`);
  const loginData = await loginRes.json();
  assert.equal(loginData.user.email, user2Email);
  const freshCookie = getCookie(loginRes);
  assert.ok(freshCookie?.startsWith('arm_session='), 'Cookie sesi baru harus diterbitkan saat login');
  console.log('  ✓ Login normal dengan email & password terdaftar berhasil (200)');

  // -------------------------------------------------------------
  // Skenario 6: Admin Config GET & PUT -> 200 & Verifikasi DB
  // -------------------------------------------------------------
  console.log('\n--- [6/8] Skenario 6: Admin Config GET & PUT (200 & Database Sync) ---');
  const adminLoginRes = await post('/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    captchaToken: 'dummy-bypass-token',
  });
  assert.equal(adminLoginRes.status, 200, `Login admin gagal: ${adminLoginRes.status}`);
  const adminCookie = getCookie(adminLoginRes);
  assert.ok(adminCookie?.startsWith('arm_session='));

  // GET /api/admin/config
  const cfgGetRes = await get('/api/admin/config', adminCookie);
  assert.equal(cfgGetRes.status, 200, `GET config gagal: ${cfgGetRes.status}`);
  const cfgGetData = await cfgGetRes.json();
  assert.ok(cfgGetData.config);
  assert.ok(Array.isArray(cfgGetData.items), 'items harus berupa array spesifikasi konfigurasi');
  assert.ok(cfgGetData.items.length >= 8, 'Harus ada minimal 8 item spesifikasi konfigurasi');

  const sampleItem = cfgGetData.items.find((i) => i.key === 'otp.ttl_minutes');
  assert.ok(sampleItem, 'otp.ttl_minutes harus ada di items');
  assert.equal(sampleItem.min, 5);
  assert.equal(sampleItem.max, 60);

  // PUT /api/admin/config (update single key)
  const putRes1 = await put('/api/admin/config', { key: 'otp.ttl_minutes', value: 25 }, adminCookie);
  assert.equal(putRes1.status, 200, `PUT config gagal: ${putRes1.status}`);
  const putData1 = await putRes1.json();
  assert.equal(putData1.value, 25);

  // Verifikasi ke database master.t_mtr_app_config
  const dbConfigVal = (await dbClient.query('SELECT value FROM master.t_mtr_app_config WHERE key = $1', ['otp.ttl_minutes'])).rows[0].value;
  assert.equal(dbConfigVal, '25', 'Nilai di master.t_mtr_app_config harus tersinkronisasi');

  // Kembalikan ke 15
  await put('/api/admin/config', { key: 'otp.ttl_minutes', value: 15 }, adminCookie);
  console.log('  ✓ Admin berhasil membaca GET /api/admin/config (8 spesifikasi lengkap)');
  console.log('  ✓ Admin berhasil PUT /api/admin/config dan nilai tersimpan di master.t_mtr_app_config');

  // -------------------------------------------------------------
  // Skenario 7: Non-admin PUT config -> 403 Forbidden
  // -------------------------------------------------------------
  console.log('\n--- [7/8] Skenario 7: Otorisasi Non-Admin (Customer Ditolak 403) ---');
  const forbiddenRes = await put(
    '/api/admin/config',
    { key: 'otp.ttl_minutes', value: 45 },
    freshCookie, // cookie customer
  );
  assert.equal(forbiddenRes.status, 403, `Non-admin PUT config harus 403, didapat: ${forbiddenRes.status}`);

  // Tanpa cookie -> 401 Unauthorized
  const unauthRes = await put('/api/admin/config', { key: 'otp.ttl_minutes', value: 45 });
  assert.equal(unauthRes.status, 401, `Tanpa cookie harus 401, didapat: ${unauthRes.status}`);
  console.log('  ✓ Non-admin (customer) ditolak 403 Forbidden oleh RolesGuard');
  console.log('  ✓ Request tanpa cookie ditolak 401 Unauthorized oleh SessionAuthGuard');

  // -------------------------------------------------------------
  // Skenario 8: Verifikasi Prisma ORM Service Model
  // -------------------------------------------------------------
  console.log('\n--- [8/8] Skenario 8: Verifikasi Prisma ORM Service ---');
  const prismaService = app.get(PrismaService);
  assert.ok(prismaService, 'PrismaService harus terdaftar di NestJS DI container');

  const prismaUser = await prismaService.user.findUnique({
    where: { email: user2Email },
    include: { sessions: true },
  });
  assert.ok(prismaUser, 'Prisma harus dapat membaca user dari schema master');
  assert.equal(prismaUser.email, user2Email);
  assert.equal(prismaUser.role, 'customer');
  assert.ok(prismaUser.sessions.length >= 1, 'Prisma relation user.sessions harus terhubung');

  const prismaConfigs = await prismaService.appConfig.findMany();
  assert.ok(prismaConfigs.length >= 8, 'Prisma harus dapat membaca appConfig');
  console.log(`  ✓ Prisma ORM sukses melakukan query multi-schema PostgreSQL (${prismaConfigs.length} config terdeteksi, relasi User -> Session valid)`);

  console.log('\n================================================================');
  console.log('🎉 SEMUA 8 SKENARIO INTEGRASI OTP, AUTH, ADMIN & PRISMA SUKSES 100%!');
  console.log('================================================================\n');
} finally {
  await dbClient.end();
  await app.close();
}
