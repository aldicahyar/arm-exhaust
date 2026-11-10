import * as crypto from 'node:crypto';
import type { Request, Response } from 'express';

export const SESSION_COOKIE = 'arm_session';
export const SESSION_DAYS = 7;

/**
 * Menghasilkan token acak CSPRNG 32-byte hex (64 karakter hex)
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Menghitung tanggal kadaluwarsa 7 hari ke depan
 */
export function calculateSessionExpires(): Date {
  return new Date(Date.now() + SESSION_DAYS * 864e5);
}

/**
 * Memasang cookie sesi arm_session pada express response
 */
export function setSessionCookie(res: Response, token: string, expires: Date): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires,
    secure: isProduction,
  });
}

/**
 * Menghapus cookie sesi arm_session pada express response
 */
export function clearSessionCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProduction,
  });
}

/**
 * Helper string header jika response manual diperlukan
 */
export function sessionCookieHeader(token: string, expires: Date): string {
  const attrs = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expires.toUTCString()}`,
  ];
  if (process.env.NODE_ENV === 'production') {
    attrs.push('Secure');
  }
  return attrs.join('; ');
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Mengambil token arm_session dari express request (req.cookies atau parse manual dari req.headers.cookie)
 */
export function extractSessionToken(req: Request): string | null {
  if (req.cookies && req.cookies[SESSION_COOKIE]) {
    return req.cookies[SESSION_COOKIE];
  }
  const rawCookie = req.headers?.cookie;
  if (!rawCookie) return null;

  for (const part of rawCookie.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) {
      const key = part.slice(0, i).trim();
      const val = decodeURIComponent(part.slice(i + 1).trim());
      if (key === SESSION_COOKIE) {
        return val;
      }
    }
  }
  return null;
}
