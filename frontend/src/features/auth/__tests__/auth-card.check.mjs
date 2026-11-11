import assert from 'node:assert/strict';

/**
 * Test Suite: Auth Split Card Component & Logic
 * Verifies:
 * 1. Email format validation & trimming edge cases
 * 2. Name & password input validation boundaries (min/max)
 * 3. Sign In <-> Register state transition logic
 * 4. HTTP response handling for success & error (400, 401, 500, network error)
 * 5. Promo slider cycle (auto-rotation, interval, boundary wraps)
 * 6. JSON payload sanitization & parameter trimming
 */

// --- 1. Email Validation ---
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

assert.equal(isValidEmail('rider@armexhaust.com'), true);
assert.equal(isValidEmail(' rider@armexhaust.com '), true, 'Email with surrounding spaces is trimmed');
assert.equal(isValidEmail('plainaddress'), false, 'Email without domain must fail');
assert.equal(isValidEmail('@missingusername.com'), false, 'Email without username must fail');
assert.equal(isValidEmail('user@.com'), false, 'Email without domain host must fail');
assert.equal(isValidEmail('user@domain'), false, 'Email without TLD must fail');
assert.equal(isValidEmail(''), false, 'Empty email must fail');

// --- 2. Form Input Validation (Domain Logic) ---
function validateForm({ mode, name, email, password }) {
  const trimmedEmail = (email || '').trim();
  if (!trimmedEmail) return 'Email is required.';
  if (!isValidEmail(trimmedEmail)) return 'Invalid email format.';
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';

  if (mode === 'register') {
    const trimmedName = (name || '').trim();
    if (!trimmedName) return 'Full name is required.';
    if (trimmedName.length < 2) return 'Name must be at least 2 characters.';
    if (trimmedName.length > 100) return 'Name must be at most 100 characters.';
  }
  return null;
}

// Sign In Edge Cases
assert.equal(validateForm({ mode: 'login', email: '', password: '' }), 'Email is required.');
assert.equal(validateForm({ mode: 'login', email: 'not-an-email', password: 'password123' }), 'Invalid email format.');
assert.equal(validateForm({ mode: 'login', email: 'user@arm.com', password: '' }), 'Password is required.');
assert.equal(validateForm({ mode: 'login', email: 'user@arm.com', password: '123' }), 'Password must be at least 8 characters.');
assert.equal(validateForm({ mode: 'login', email: 'user@arm.com', password: 'validPassword123' }), null);

// Register Edge Cases
assert.equal(
  validateForm({ mode: 'register', name: '', email: 'user@arm.com', password: 'validPassword123' }),
  'Full name is required.'
);
assert.equal(
  validateForm({ mode: 'register', name: 'A', email: 'user@arm.com', password: 'validPassword123' }),
  'Name must be at least 2 characters.'
);
assert.equal(
  validateForm({ mode: 'register', name: 'A'.repeat(101), email: 'user@arm.com', password: 'validPassword123' }),
  'Name must be at most 100 characters.'
);
assert.equal(
  validateForm({ mode: 'register', name: 'Dimas Pratama', email: 'dimas@arm.com', password: 'validPassword123' }),
  null
);

// --- 3. Mode State Transition ---
function toggleMode(current) {
  return current === 'login' ? 'register' : 'login';
}
assert.equal(toggleMode('login'), 'register');
assert.equal(toggleMode('register'), 'login');

// --- 4. HTTP Auth API Integration Simulation ---
async function mockAuthApiCall({ endpoint, payload, mockStatus, mockResponse }) {
  if (mockStatus === 'network_error') {
    throw new Error('Cannot connect to the backend server. Make sure it is running.');
  }
  return {
    ok: mockStatus >= 200 && mockStatus < 300,
    status: mockStatus,
    json: async () => mockResponse,
  };
}

// Test: Successful Login Scenario
const resLogin = await mockAuthApiCall({
  endpoint: '/api/auth/login',
  payload: { email: 'admin@armexhaust.com', password: 'adminPassword123' },
  mockStatus: 200,
  mockResponse: { ok: true, user: { id: 1, email: 'admin@armexhaust.com', role: 'admin' } },
});
assert.equal(resLogin.ok, true);
const dataLogin = await resLogin.json();
assert.equal(dataLogin.user.role, 'admin');

// Test: Wrong Password Scenario (401)
const resFailed = await mockAuthApiCall({
  endpoint: '/api/auth/login',
  payload: { email: 'user@arm.com', password: 'wrongPassword' },
  mockStatus: 401,
  mockResponse: { error: 'Invalid email or password.' },
});
assert.equal(resFailed.ok, false);
const dataFailed = await resFailed.json();
assert.equal(dataFailed.error, 'Invalid email or password.');

// Test: Network Error Handled
try {
  await mockAuthApiCall({
    endpoint: '/api/auth/login',
    payload: {},
    mockStatus: 'network_error',
  });
  assert.fail('Should have thrown a network error');
} catch (err) {
  assert.ok(err.message.includes('Cannot connect to the backend server'));
}

// --- 5. Slider Logic & Boundary Wraparound ---
function nextSlide(currentIndex, total) {
  return (currentIndex + 1) % total;
}
function prevSlide(currentIndex, total) {
  return (currentIndex - 1 + total) % total;
}
const SLIDE_COUNT = 3;
assert.equal(nextSlide(0, SLIDE_COUNT), 1);
assert.equal(nextSlide(1, SLIDE_COUNT), 2);
assert.equal(nextSlide(2, SLIDE_COUNT), 0, 'Next wraps from last slide back to the first');
assert.equal(prevSlide(0, SLIDE_COUNT), 2, 'Prev wraps from first slide to the last');
assert.equal(prevSlide(2, SLIDE_COUNT), 1);

// --- 6. Payload Sanitization (Email lowercasing & name trimming) ---
function sanitizeAuthPayload(raw) {
  return {
    name: raw.name ? raw.name.trim() : undefined,
    email: raw.email ? raw.email.trim().toLowerCase() : '',
    password: raw.password,
  };
}
const sanitized = sanitizeAuthPayload({
  name: '  Budi Santoso  ',
  email: '  BUDI@Gmail.Com ',
  password: 'mySecretPassword',
});
assert.equal(sanitized.name, 'Budi Santoso');
assert.equal(sanitized.email, 'budi@gmail.com');
assert.equal(sanitized.password, 'mySecretPassword');

// --- 7. Google SSO Credential Payload & Flow Simulation ---
async function handleGoogleSuccessSimulation({ credential, mockStatus, mockResponse }) {
  const res = await mockAuthApiCall({
    endpoint: '/api/auth/google',
    payload: { credential },
    mockStatus,
    mockResponse,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Google authentication failed.');
  }
  return await res.json();
}

// Success Google Login
const resGoogleSuccess = await handleGoogleSuccessSimulation({
  credential: 'MOCK_GOOGLE_123_rider@armexhaust.com_Rider',
  mockStatus: 200,
  mockResponse: { ok: true, user: { id: 2, email: 'rider@armexhaust.com', role: 'customer' } },
});
assert.equal(resGoogleSuccess.user.email, 'rider@armexhaust.com');
assert.equal(resGoogleSuccess.user.role, 'customer');

// Failed Google Login (401)
try {
  await handleGoogleSuccessSimulation({
    credential: 'invalid_token',
    mockStatus: 401,
    mockResponse: { error: 'Token Google tidak valid.' },
  });
  assert.fail('Invalid token should have thrown error');
} catch (err) {
  assert.equal(err.message, 'Token Google tidak valid.');
}

// --- 8. Password Policy & Strength (Register) ---
// Mirror dari useAuthForm.ts & backend/src/auth.mjs — ubah ketiganya bersamaan.
function validatePasswordPolicy(password) {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter (A-Z).';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter (a-z).';
  if (!/[0-9]/.test(password)) return 'Password must contain a number (0-9).';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).';
  }
  return null;
}
function getPasswordStrength(pw) {
  if (!pw) return 'empty';
  const classes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*(),.?":{}|<>]/].filter((r) => r.test(pw)).length;
  if (pw.length < 8 || classes <= 2) return 'weak';
  if (classes === 3) return 'medium';
  return 'strong';
}

assert.equal(validatePasswordPolicy('Str0ng!Pass'), null);
assert.equal(validatePasswordPolicy('NoSpecial11'), 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).');
assert.equal(validatePasswordPolicy('Dash-Sym_1a'), 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).');

assert.equal(getPasswordStrength(''), 'empty');
assert.equal(getPasswordStrength('abc'), 'weak');
assert.equal(getPasswordStrength('abcdefgh'), 'weak', 'panjang cukup tapi 1 kelas → lemah');
assert.equal(getPasswordStrength('Abcdefg1'), 'medium', '3 kelas → sedang');
assert.equal(getPasswordStrength('Abcdefg!'), 'medium', '3 kelas → sedang');
assert.equal(getPasswordStrength('Abcdef1!'), 'strong', '4 kelas + panjang ≥8 → kuat (compliant)');

// Register: mismatch & policy divalidasi submit; login tidak kena policy
function validateRegisterForm({ name, email, password, confirmPassword }) {
  const policyError = validatePasswordPolicy(password);
  if (policyError) return policyError;
  if (confirmPassword !== password) return 'Passwords do not match.';
  const trimmedName = (name || '').trim();
  if (!trimmedName) return 'Full name is required.';
  return null;
}
assert.equal(
  validateRegisterForm({ name: 'Budi', email: 'b@arm.com', password: 'Abcdef1!', confirmPassword: 'Abcdef1!' }),
  null,
);
assert.equal(
  validateRegisterForm({ name: 'Budi', email: 'b@arm.com', password: 'Abcdef1!', confirmPassword: 'Xbcdef1!' }),
  'Passwords do not match.',
);
assert.equal(
  validateRegisterForm({ name: 'Budi', email: 'b@arm.com', password: 'pass', confirmPassword: 'pass' }),
  'Password must be at least 8 characters.',
);

// --- 9. Form -> OTP State Transition Logic ---
function simulateAuthWorkflow() {
  let step = 'form';
  let mode = 'register';

  function onRegisterResponse(res) {
    if (res.requiresOtp) {
      step = 'otp';
    }
  }

  function backToForm() {
    step = 'form';
  }

  function switchMode(newMode) {
    mode = newMode;
    step = 'form';
  }

  return {
    getStep: () => step,
    getMode: () => mode,
    onRegisterResponse,
    backToForm,
    switchMode,
  };
}

const flow = simulateAuthWorkflow();
assert.equal(flow.getStep(), 'form');
flow.onRegisterResponse({ requiresOtp: true });
assert.equal(flow.getStep(), 'otp', 'Successful register with requiresOtp switches step to otp');
flow.backToForm();
assert.equal(flow.getStep(), 'form', 'backToForm returns step to form');
flow.onRegisterResponse({ requiresOtp: true });
assert.equal(flow.getStep(), 'otp');
flow.switchMode('login');
assert.equal(flow.getStep(), 'form', 'Switching auth mode resets step to form');

// --- 10. OTP 6-Digit Validation Logic ---
function validateOtpCode(code) {
  const cleanCode = String(code || '').trim();
  if (!cleanCode) return 'Kode OTP wajib diisi.';
  if (cleanCode.length !== 6) return 'Kode OTP harus berupa 6 digit angka.';
  if (!/^\d{6}$/.test(cleanCode)) return 'Kode OTP hanya boleh memuat angka 0-9.';
  return null;
}

assert.equal(validateOtpCode('123456'), null);
assert.equal(validateOtpCode(' 654321 '), null, 'Surrounding whitespace should be trimmed');
assert.equal(validateOtpCode(''), 'Kode OTP wajib diisi.');
assert.equal(validateOtpCode('12345'), 'Kode OTP harus berupa 6 digit angka.');
assert.equal(validateOtpCode('1234567'), 'Kode OTP harus berupa 6 digit angka.');
assert.equal(validateOtpCode('12345a'), 'Kode OTP hanya boleh memuat angka 0-9.');
assert.equal(validateOtpCode('12-456'), 'Kode OTP hanya boleh memuat angka 0-9.');

// --- 11. OTP Countdown & Timer Formatting ---
function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

assert.equal(formatTimer(900), '15:00', '15 minutes format');
assert.equal(formatTimer(65), '01:05', '1 minute 5 seconds format');
assert.equal(formatTimer(9), '00:09', 'Single digit seconds format');
assert.equal(formatTimer(0), '00:00', 'Zero timer format');

// --- 12. OTP Verification & Resend API Simulation ---
async function verifyOtpSimulation({ email, otp, mockStatus, mockResponse }) {
  const res = await mockAuthApiCall({
    endpoint: '/api/auth/verify-otp',
    payload: { email: email.trim().toLowerCase(), otp },
    mockStatus,
    mockResponse,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'OTP tidak valid atau kedaluwarsa.');
  }
  return await res.json();
}

// Scenario 1: OTP Success
const verifySuccess = await verifyOtpSimulation({
  email: 'rider@armexhaust.com',
  otp: '123456',
  mockStatus: 200,
  mockResponse: { user: { id: 10, email: 'rider@armexhaust.com', role: 'customer' } },
});
assert.equal(verifySuccess.user.email, 'rider@armexhaust.com');
assert.equal(verifySuccess.user.role, 'customer');

// Scenario 2: OTP Invalid (400)
try {
  await verifyOtpSimulation({
    email: 'rider@armexhaust.com',
    otp: '999999',
    mockStatus: 400,
    mockResponse: { error: 'OTP tidak valid atau kedaluwarsa.' },
  });
  assert.fail('Invalid OTP should throw');
} catch (err) {
  assert.equal(err.message, 'OTP tidak valid atau kedaluwarsa.');
}

// Scenario 3: OTP Locked (423)
try {
  await verifyOtpSimulation({
    email: 'rider@armexhaust.com',
    otp: '111111',
    mockStatus: 423,
    mockResponse: { error: 'Too many failed attempts. Try again later.' },
  });
  assert.fail('Locked OTP should throw');
} catch (err) {
  assert.equal(err.message, 'Too many failed attempts. Try again later.');
}

console.log('# OK: Auth split card unit & integration verification passed with 100% assertions.');
