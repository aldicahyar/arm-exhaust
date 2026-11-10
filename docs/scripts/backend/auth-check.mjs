// Self-check auth end-to-end langsung ke backend.
// Jalankan: npm run check (di folder backend, server harus nyala)
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:4000';
const email = `cek-${Date.now()}@test.local`;
const password = 'PasswordTest123!';

function getCookie(res) {
  const [cookie] = res.headers.getSetCookie()[0].split(';');
  return cookie;
}

async function post(path, body, cookie) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

// 1. Register → 200 + cookie + role customer
const reg = await post('/api/auth/register', { name: 'Cek Otomatis', email, password });
assert.equal(reg.status, 200, `register gagal: ${reg.status}`);
const regCookie = getCookie(reg);
assert.ok(regCookie.startsWith('arm_session='), 'cookie session tidak terpasang');
assert.equal((await reg.json()).user.role, 'customer');

// 2. Email duplikat → 409
const dup = await post('/api/auth/register', { name: 'Dup', email, password });
assert.equal(dup.status, 409);

// 2b. Password tidak memenuhi kebijakan → 400 + pesan spesifik
const weak = await post('/api/auth/register', {
  name: 'Lemah', email: `weak-${Date.now()}@test.local`, password: 'passwordtest123',
});
assert.equal(weak.status, 400, 'password tanpa huruf besar/simbol harus 400');
assert.equal((await weak.json()).error, 'Password must contain an uppercase letter (A-Z).');

// 3. Login password salah → 401
const wrong = await post('/api/auth/login', { email, password: 'salahbanget1' });
assert.equal(wrong.status, 401);

// 4. Login benar → 200 + cookie
const login = await post('/api/auth/login', { email, password });
assert.equal(login.status, 200);
const loginCookie = getCookie(login);
assert.ok(loginCookie.startsWith('arm_session='));

// 5. /me pakai cookie → user cocok; tanpa cookie → null
const me = await fetch(`${BASE}/api/auth/me`, { headers: { cookie: loginCookie } });
assert.equal((await me.json()).user.email, email);
const anon = await (await fetch(`${BASE}/api/auth/me`)).json();
assert.equal(anon.user, null);

// 6. Logout → session mati
const logout = await post('/api/auth/logout', {}, loginCookie);
assert.equal(logout.status, 200);
const after = await (await fetch(`${BASE}/api/auth/me`, { headers: { cookie: loginCookie } })).json();
assert.equal(after.user, null, 'session masih hidup setelah logout');

console.log(`OK — register/duplikat/login-salah/login/me/logout semua lolos (${email})`);
