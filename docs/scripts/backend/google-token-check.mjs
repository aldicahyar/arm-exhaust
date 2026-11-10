// Test unit untuk verifikasi Google ID Token (backend/src/google-auth.mjs)
// Jalankan: node scripts/google-token-check.mjs
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyGoogleIdToken } from '../../prototypes/backend-mjs/google-auth.mjs';

function base64url(input) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.from(JSON.stringify(input), 'utf8');
  return buf.toString('base64url');
}

// 1. JWT parsing: reject jika bukan 3 bagian dipisahkan titik
await assert.rejects(
  () => verifyGoogleIdToken('bukan-jwt'),
  /format/i,
  'Harus reject format JWT tidak valid'
);

await assert.rejects(
  () => verifyGoogleIdToken('part1.part2'),
  /format/i,
  'Harus reject format JWT dengan 2 bagian'
);

// Helper untuk membuat token dummy RS256
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const jwkPublic = publicKey.export({ format: 'jwk' });
jwkPublic.kid = 'test-key-1';
jwkPublic.alg = 'RS256';

function signToken(header, payload, privKey) {
  const h = base64url(header);
  const p = base64url(payload);
  const data = `${h}.${p}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  const sig = sign.sign(privKey, 'base64url');
  return `${data}.${sig}`;
}

const now = Math.floor(Date.now() / 1000);

// 2. Reject jika header bukan RS256
const tokenWrongAlg = signToken(
  { alg: 'HS256', typ: 'JWT', kid: 'test-key-1' },
  { sub: '123', email: 'test@example.com', email_verified: true, exp: now + 3600, iss: 'https://accounts.google.com' },
  privateKey
);
await assert.rejects(
  () => verifyGoogleIdToken(tokenWrongAlg),
  /alg/i,
  'Harus reject jika header.alg bukan RS256'
);

// 3. Reject jika expired (payload.exp < now)
const tokenExpired = signToken(
  { alg: 'RS256', typ: 'JWT', kid: 'test-key-1' },
  { sub: '123', email: 'test@example.com', email_verified: true, exp: now - 100, iss: 'https://accounts.google.com' },
  privateKey
);
await assert.rejects(
  () => verifyGoogleIdToken(tokenExpired),
  /expired/i,
  'Harus reject jika token kadaluarsa'
);

// 4. Reject jika issuer tidak valid
const tokenWrongIss = signToken(
  { alg: 'RS256', typ: 'JWT', kid: 'test-key-1' },
  { sub: '123', email: 'test@example.com', email_verified: true, exp: now + 3600, iss: 'https://evil.com' },
  privateKey
);
await assert.rejects(
  () => verifyGoogleIdToken(tokenWrongIss),
  /issuer|iss/i,
  'Harus reject jika issuer tidak valid'
);

// 5. Reject jika email_verified bukan true
const tokenUnverifiedEmail = signToken(
  { alg: 'RS256', typ: 'JWT', kid: 'test-key-1' },
  { sub: '123', email: 'test@example.com', email_verified: false, exp: now + 3600, iss: 'https://accounts.google.com' },
  privateKey
);
await assert.rejects(
  () => verifyGoogleIdToken(tokenUnverifiedEmail),
  /email/i,
  'Harus reject jika email belum diverifikasi'
);

// 6. Reject jika aud tidak cocok dengan expectedClientId
const tokenWrongAud = signToken(
  { alg: 'RS256', typ: 'JWT', kid: 'test-key-1' },
  { sub: '123', email: 'test@example.com', email_verified: true, exp: now + 3600, iss: 'https://accounts.google.com', aud: 'other-client' },
  privateKey
);
await assert.rejects(
  () => verifyGoogleIdToken(tokenWrongAud, 'expected-client-id'),
  /aud/i,
  'Harus reject jika aud tidak cocok'
);

// 7. Mock / fallback verifier untuk dev environment
process.env.NODE_ENV = 'development';
const mockUser = await verifyGoogleIdToken('MOCK_GOOGLE_sub123_test@example.com_TestUser');
assert.equal(mockUser.sub, 'sub123');
assert.equal(mockUser.email, 'test@example.com');
assert.equal(mockUser.name, 'TestUser');

// Pastikan di production mock token ditolak
process.env.NODE_ENV = 'production';
await assert.rejects(
  () => verifyGoogleIdToken('MOCK_GOOGLE_sub123_test@example.com_TestUser'),
  /production|format/i,
  'Mock token harus ditolak di production'
);
process.env.NODE_ENV = 'development';

// 8. Verifikasi cryptographic dengan custom JWKS fetcher / key
const validToken = signToken(
  { alg: 'RS256', typ: 'JWT', kid: 'test-key-1' },
  { sub: 'google-sub-999', email: 'valid@example.com', email_verified: true, exp: now + 3600, iss: 'https://accounts.google.com', aud: 'my-client-app', name: 'Valid User', picture: 'https://example.com/avatar.jpg' },
  privateKey
);

// Uji signature gagal jika kid tidak ditemukan atau JWKS salah
await assert.rejects(
  () => verifyGoogleIdToken(validToken, 'my-client-app', { fetchJwks: async () => ({ keys: [] }) }),
  /key|jwk/i,
  'Harus reject jika kid tidak ditemukan di JWKS'
);

// Uji signature lolos jika JWKS cocok
const verified = await verifyGoogleIdToken(validToken, 'my-client-app', {
  fetchJwks: async () => ({ keys: [jwkPublic] }),
});
assert.equal(verified.sub, 'google-sub-999');
assert.equal(verified.email, 'valid@example.com');
assert.equal(verified.name, 'Valid User');
assert.equal(verified.picture, 'https://example.com/avatar.jpg');

// Uji signature tamper (payload diubah)
const tamperedToken = `${base64url({ alg: 'RS256', typ: 'JWT', kid: 'test-key-1' })}.${base64url({ sub: 'hacked', email: 'hacked@example.com', email_verified: true, exp: now + 3600, iss: 'https://accounts.google.com', aud: 'my-client-app' })}.${validToken.split('.')[2]}`;
await assert.rejects(
  () => verifyGoogleIdToken(tamperedToken, 'my-client-app', { fetchJwks: async () => ({ keys: [jwkPublic] }) }),
  /signature/i,
  'Harus reject jika signature tidak valid / tampered'
);

console.log('OK - Semua test verifikasi google token lolos');
