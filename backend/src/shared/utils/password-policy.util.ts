/**
 * Kebijakan password registrasi:
 * - Minimal 8 karakter
 * - Wajib huruf besar [A-Z]
 * - Wajib huruf kecil [a-z]
 * - Wajib angka [0-9]
 * - Wajib simbol dari set [!@#$%^&*(),.?":{}|<>]
 *
 * Mengembalikan string error spesifik atau null jika valid.
 */
export function validatePasswordPolicy(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain an uppercase letter (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain a lowercase letter (a-z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain a number (0-9).';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain a special character (!@#$%^&*(),.?":{}|<>).';
  }
  return null;
}
