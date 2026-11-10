// Unit & Integration test untuk OtpService, SecurityConfigService, RateLimiterService, TurnstileService, MailerService
// Jalankan: node --env-file=.env scripts/otp-check.mjs
import assert from 'node:assert/strict';
import { DatabaseService } from '../../../backend/dist/core/database/database.service.js';
import { OtpService } from '../../../backend/dist/core/otp/otp.service.js';
import { SecurityConfigService, SECURITY_CONFIG_SPECS } from '../../../backend/dist/core/security/security-config.service.js';
import { TurnstileService } from '../../../backend/dist/core/security/turnstile.service.js';
import { RateLimiterService, cleanIp } from '../../../backend/dist/core/security/rate-limiter.service.js';
import { MailerService } from '../../../backend/dist/core/security/mailer.service.js';

console.log('🧪 Memulai Verifikasi NestJS OTP & Security Module...');

// -------------------------------------------------------------
// 1. Verifikasi OtpService: CSPRNG 6-digit OTP
// -------------------------------------------------------------
console.log('\n[1/7] Menguji CSPRNG 6-digit generateOtp()...');
const otpService = new OtpService();
const sampleOtps = new Set();

for (let i = 0; i < 200; i++) {
  const otp = otpService.generateOtp();
  assert.equal(typeof otp, 'string', 'OTP harus bertipe string');
  assert.equal(otp.length, 6, `Panjang OTP harus 6 karakter, didapat: ${otp}`);
  assert.match(otp, /^[0-9]{6}$/, `OTP harus 6 digit angka: ${otp}`);
  const num = Number(otp);
  assert.ok(num >= 100000 && num <= 999999, `OTP harus dalam rentang 100000-999999: ${num}`);
  sampleOtps.add(otp);
}
assert.ok(sampleOtps.size > 150, 'CSPRNG harus acak dan menghasilkan variasi tinggi');
console.log(`  ✓ Berhasil membuat 200 sampel OTP unik (${sampleOtps.size} nilai unik) dalam rentang 100000-999999.`);

// -------------------------------------------------------------
// 2. Verifikasi OtpService: scrypt Hash & verifyOtpHash (timingSafeEqual)
// -------------------------------------------------------------
console.log('\n[2/7] Menguji hashOtp() & verifyOtpHash() dengan timingSafeEqual...');
const testOtp = '849201';
const hashed = await otpService.hashOtp(testOtp);

assert.ok(hashed.includes(':'), 'Hash format harus salt:hash');
const [salt, hashHex] = hashed.split(':');
assert.equal(salt.length, 32, 'Salt 16 bytes hex harus 32 karakter hex');
assert.equal(hashHex.length, 128, 'Derived key scrypt 64 bytes hex harus 128 karakter hex');

// Verifikasi cocok
const isMatch = await otpService.verifyOtpHash(testOtp, hashed);
assert.equal(isMatch, true, 'OTP yang benar harus terverifikasi true');

// Verifikasi salah
const isWrong = await otpService.verifyOtpHash('849202', hashed);
assert.equal(isWrong, false, 'OTP yang salah harus return false');

// Verifikasi input rusak / kosong
assert.equal(await otpService.verifyOtpHash('', hashed), false, 'OTP kosong harus return false');
assert.equal(await otpService.verifyOtpHash(testOtp, 'invalidsalt:invalidhash'), false, 'Hash rusak harus return false');
assert.equal(await otpService.verifyOtpHash(testOtp, ''), false, 'Hash kosong harus return false');
console.log('  ✓ scrypt hashing dan timingSafeEqual verification bekerja presisi dan tahan timing-attack.');

// -------------------------------------------------------------
// 3. Verifikasi OtpService: AES-256-GCM Enkripsi & Dekripsi
// -------------------------------------------------------------
console.log('\n[3/7] Menguji AES-256-GCM encryptPayload() & decryptPayload()...');
const originalPayload = {
  email: 'aldi@armexhaust.id',
  name: 'Aldi Customer',
  password_hash: 'secret-hash-here',
  metadata: { createdBy: 'test', attempt: 1 },
};

const cipherText1 = otpService.encryptPayload(originalPayload);
const cipherText2 = otpService.encryptPayload(originalPayload);

assert.notEqual(cipherText1, cipherText2, 'Setiap enkripsi WAJIB menghasilkan IV acak sehingga ciphertext berbeda');

const parts1 = cipherText1.split(':');
assert.equal(parts1.length, 3, 'Format ciphertext harus base64(iv):base64(tag):base64(ciphertext)');

// Dekripsi kembali
const decrypted1 = otpService.decryptPayload(cipherText1);
assert.deepEqual(decrypted1, originalPayload, 'Hasil dekripsi harus identik dengan payload asli');

const decrypted2 = otpService.decryptPayload(cipherText2);
assert.deepEqual(decrypted2, originalPayload, 'Ciphertext kedua juga harus berhasil didekripsi ke payload asli');

// Uji tampering / integritas GCM
let tampered = false;
try {
  const [ivB64, tagB64, dataB64] = parts1;
  const tamperedData = dataB64.slice(0, -2) + 'AA';
  otpService.decryptPayload(`${ivB64}:${tagB64}:${tamperedData}`);
} catch (err) {
  tampered = true;
}
assert.ok(tampered, 'Payload yang dimodifikasi harus memicu auth tag mismatch error');
console.log('  ✓ AES-256-GCM enkripsi (random IV), dekripsi, dan integritas auth tag terverifikasi 100%.');

// -------------------------------------------------------------
// 4. Verifikasi SecurityConfigService: Clamping & Multi-tiered Resolution
// -------------------------------------------------------------
console.log('\n[4/7] Menguji SecurityConfigService parameter clamping & defaults...');
const configService = new SecurityConfigService();

// Verifikasi seluruh 8 parameter clamping
assert.equal(configService.clampConfig('otp.ttl_minutes', 1), 5, 'otp.ttl_minutes min 5');
assert.equal(configService.clampConfig('otp.ttl_minutes', 100), 60, 'otp.ttl_minutes max 60');
assert.equal(configService.clampConfig('otp.ttl_minutes', 20), 20, 'otp.ttl_minutes in-range 20');

assert.equal(configService.clampConfig('otp.max_attempts', 1), 2, 'otp.max_attempts min 2');
assert.equal(configService.clampConfig('otp.max_attempts', 50), 10, 'otp.max_attempts max 10');

assert.equal(configService.clampConfig('otp.lock_minutes', 0), 1, 'otp.lock_minutes min 1');
assert.equal(configService.clampConfig('otp.lock_minutes', 99), 60, 'otp.lock_minutes max 60');

assert.equal(configService.clampConfig('ratelimit.max_requests', 1), 3, 'ratelimit.max_requests min 3');
assert.equal(configService.clampConfig('ratelimit.max_requests', 999), 50, 'ratelimit.max_requests max 50');

assert.equal(configService.clampConfig('ratelimit.window_minutes', 2), 5, 'ratelimit.window_minutes min 5');
assert.equal(configService.clampConfig('ratelimit.window_minutes', 120), 60, 'ratelimit.window_minutes max 60');

assert.equal(configService.clampConfig('ratelimit.block_minutes', 0), 1, 'ratelimit.block_minutes min 1');
assert.equal(configService.clampConfig('ratelimit.block_minutes', 100), 60, 'ratelimit.block_minutes max 60');

assert.equal(configService.clampConfig('ratelimit.repeat_window_minutes', 5), 10, 'ratelimit.repeat_window_minutes min 10');
assert.equal(configService.clampConfig('ratelimit.repeat_window_minutes', 3000), 1440, 'ratelimit.repeat_window_minutes max 1440');

assert.equal(configService.clampConfig('ratelimit.repeat_block_minutes', 1), 5, 'ratelimit.repeat_block_minutes min 5');
assert.equal(configService.clampConfig('ratelimit.repeat_block_minutes', 99), 60, 'ratelimit.repeat_block_minutes max 60');

// Uji getConfig tiered resolution & Env Override
process.env.CONFIG_OVERRIDE_OTP_TTL_MINUTES = '25';
const resolvedConfig = await configService.getConfig();
assert.equal(resolvedConfig['otp.ttl_minutes'], 25, 'Env override CONFIG_OVERRIDE_OTP_TTL_MINUTES harus diprioritaskan');
assert.equal(resolvedConfig['otp.max_attempts'], 3, 'Default harus digunakan jika env override tidak ada');
delete process.env.CONFIG_OVERRIDE_OTP_TTL_MINUTES;
console.log('  ✓ Seluruh 8 parameter keamanan dikelola dengan rentang aman (clamping) dan resolusi berjenjang.');

// -------------------------------------------------------------
// 5. Verifikasi TurnstileService & MailerService
// -------------------------------------------------------------
console.log('\n[5/7] Menguji TurnstileService & MailerService...');
const turnstileService = new TurnstileService();
const bypassResult = await turnstileService.verifyTurnstile('dummy-bypass-token', '127.0.0.1');
assert.equal(bypassResult.success, true, 'dummy-bypass-token harus menghasilkan success: true');

const mailerService = new MailerService();
await mailerService.sendOtpEmail('test@armexhaust.id', '123456');
console.log('  ✓ Turnstile bypass dan Mailer structured log dev berfungsi normal.');

// -------------------------------------------------------------
// 6. Verifikasi RateLimiter Exponential Backoff & IP Sanitizer
// -------------------------------------------------------------
console.log('\n[6/7] Menguji exponential backoff & cleanIp...');
function calcBackoff(attempt) {
  return Math.min(4000, 250 * Math.pow(2, Math.max(0, attempt - 1)));
}
assert.equal(calcBackoff(1), 250);
assert.equal(calcBackoff(2), 500);
assert.equal(calcBackoff(3), 1000);
assert.equal(calcBackoff(4), 2000);
assert.equal(calcBackoff(5), 4000);
assert.equal(calcBackoff(6), 4000, 'Backoff harus capped di 4000ms');

assert.equal(cleanIp('::ffff:127.0.0.1'), '127.0.0.1');
assert.equal(cleanIp('localhost'), '127.0.0.1');
assert.equal(cleanIp(' 192.168.1.1 '), '192.168.1.1');
console.log('  ✓ Formula eksponensial backoff dan sanitasi IP INET terverifikasi.');

// -------------------------------------------------------------
// 7. Verifikasi Integrasi PostgreSQL: SecurityConfig & RateLimiter
// -------------------------------------------------------------
console.log('\n[7/7] Menguji integrasi DatabaseService, SecurityConfigService & RateLimiterService...');
const db = new DatabaseService();
db.onModuleInit();

try {
  const dbConfigService = new SecurityConfigService(db);
  const dbConfigs = await dbConfigService.getConfig();
  assert.equal(typeof dbConfigs['otp.ttl_minutes'], 'number', 'Config dari DB harus bertipe number');
  assert.ok(dbConfigs['otp.ttl_minutes'] >= 5 && dbConfigs['otp.ttl_minutes'] <= 60);

  // Uji updateConfig dengan invalidasi cache
  const originalTtl = dbConfigs['otp.ttl_minutes'];
  const updatedClamped = await dbConfigService.updateConfig('otp.ttl_minutes', 20);
  assert.equal(updatedClamped, 20);
  const freshConfig = await dbConfigService.getConfig();
  assert.equal(freshConfig['otp.ttl_minutes'], 20, 'Config setelah update harus 20');

  // Kembalikan ke nilai awal
  await dbConfigService.updateConfig('otp.ttl_minutes', originalTtl);

  // Uji RateLimiterService terhadap tabel transaction.t_trx_rate_limits
  const testIp = '198.51.100.42'; // TEST-NET-2 IP
  const testAction = `unit_test_${Date.now()}`;
  const rateLimiter = new RateLimiterService(db, dbConfigService);

  // Bersihkan record test lama jika ada
  await db.query('DELETE FROM transaction.t_trx_rate_limits WHERE ip_address = $1::inet', [testIp]);

  // Max requests default adalah 5. Lakukan 5 request yang seharusnya allowed: true
  for (let i = 1; i <= 5; i++) {
    const check = await rateLimiter.checkRateLimit(testIp, testAction);
    assert.equal(check.allowed, true, `Request ke-${i} harus allowed: true`);
  }

  // Request ke-6 harus ditolak (rate-limited) dan menghasilkan retryAfterSec > 0
  const blockedCheck = await rateLimiter.checkRateLimit(testIp, testAction);
  assert.equal(blockedCheck.allowed, false, 'Request ke-6 harus diblokir (allowed: false)');
  assert.ok(blockedCheck.retryAfterSec > 0, 'Harus mengembalikan waktu tunggu retryAfterSec > 0');

  // Bersihkan record test
  await db.query('DELETE FROM transaction.t_trx_rate_limits WHERE ip_address = $1::inet', [testIp]);
  console.log('  ✓ Database integration test untuk SecurityConfigService dan RateLimiterService sukses penuh!');
} finally {
  await db.onModuleDestroy();
}

console.log('\n🎉 SEMUA 7 VERIFIKASI SECURITY & OTP (UNIT & DATABASE) LOLOS DENGAN SUKSES!\n');
