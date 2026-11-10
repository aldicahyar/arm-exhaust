import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'node:crypto';

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ALLOWED_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

export interface GoogleUserPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

interface JwksCache {
  keys: any[] | null;
  expiresAt: number;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private jwksCache: JwksCache = {
    keys: null,
    expiresAt: 0,
  };

  private async fetchJwks(): Promise<{ keys: any[] }> {
    const now = Date.now();
    if (this.jwksCache.keys && this.jwksCache.expiresAt > now) {
      return { keys: this.jwksCache.keys };
    }

    const res = await fetch(GOOGLE_CERTS_URL);
    if (!res.ok) {
      throw new Error(`Gagal mengambil JWKS Google: ${res.status}`);
    }

    let maxAge = 3600;
    const cc = res.headers.get('cache-control');
    if (cc) {
      const match = cc.match(/max-age=(\d+)/i);
      if (match) maxAge = parseInt(match[1], 10);
    }

    const data = await res.json();
    this.jwksCache = {
      keys: data.keys ?? [],
      expiresAt: now + maxAge * 1000,
    };
    return data;
  }

  private parseJwtSegment(segment: string): any {
    try {
      return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Format JWT tidak valid: gagal decode segment JSON');
    }
  }

  /**
   * Memverifikasi Google ID Token secara native menggunakan node:crypto & fetch stdlib
   */
  async verifyGoogleIdToken(
    idToken: string,
    expectedClientId?: string,
    options: { fetchJwks?: () => Promise<{ keys: any[] }> } = {},
  ): Promise<GoogleUserPayload> {
    if (!idToken || typeof idToken !== 'string') {
      throw new UnauthorizedException('Format token tidak valid');
    }

    // 1. Mock token handling untuk dev / automated testing
    if (idToken.startsWith('MOCK_GOOGLE_')) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Mock token tidak diizinkan di production environment');
      }
      const parts = idToken.slice('MOCK_GOOGLE_'.length).split('_');
      const sub = parts[0] || 'mock-google-sub';
      const email = (parts[1] || 'mock@google.com').toLowerCase();
      const name = parts[2] || 'Mock Google User';
      return {
        sub,
        email,
        name,
        picture: 'https://lh3.googleusercontent.com/a/default-user',
      };
    }

    // 2. Format JWT: 3 bagian (header.payload.signature)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Format JWT tidak valid: harus terdiri dari 3 bagian');
    }

    const [rawHeader, rawPayload, rawSig] = parts;
    const header = this.parseJwtSegment(rawHeader);
    const payload = this.parseJwtSegment(rawPayload);

    // 3. Validasi header
    if (header.alg !== 'RS256') {
      throw new UnauthorizedException(`Header alg tidak didukung: ${header.alg}, diharapkan RS256`);
    }

    // 4. Validasi payload: exp, iss, email_verified, aud
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) {
      throw new UnauthorizedException('Token expired: waktu berlaku sudah habis');
    }

    if (!ALLOWED_ISSUERS.has(payload.iss)) {
      throw new UnauthorizedException(`Issuer tidak valid: ${payload.iss}`);
    }

    const isEmailVerified = payload.email_verified === true || payload.email_verified === 'true';
    if (!isEmailVerified) {
      throw new UnauthorizedException('Email akun Google belum diverifikasi');
    }

    if (expectedClientId && payload.aud !== expectedClientId) {
      throw new UnauthorizedException(`Audience (aud) token tidak cocok dengan clientId: ${payload.aud}`);
    }

    // 5. Verifikasi cryptographic signature dengan JWKS Google
    const fetchJwksFn = options.fetchJwks || (() => this.fetchJwks());
    const jwks = await fetchJwksFn();
    const jwk = (jwks.keys || []).find((k: any) => k.kid === header.kid);
    if (!jwk) {
      throw new UnauthorizedException(`Kunci publik untuk kid ${header.kid} tidak ditemukan di JWKS`);
    }

    const publicKey = crypto.createPublicKey({
      key: jwk,
      format: 'jwk',
    });

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(`${rawHeader}.${rawPayload}`);
    const signatureBuffer = Buffer.from(rawSig, 'base64url');
    const isValid = verify.verify(publicKey, signatureBuffer);

    if (!isValid) {
      throw new UnauthorizedException('Signature token Google tidak valid');
    }

    return {
      sub: payload.sub,
      email: (payload.email || '').toLowerCase(),
      name: payload.name || payload.email,
      picture: payload.picture || '',
    };
  }
}
