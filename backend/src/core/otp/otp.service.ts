import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

@Injectable()
export class OtpService {
  /**
   * Resolves the 32-byte encryption key from process.env.APP_ENCRYPTION_KEY
   * Supports base64, hex, or 32-char raw utf-8 string.
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.APP_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('APP_ENCRYPTION_KEY is not configured in environment variables');
    }

    // 64-char hex -> 32 bytes
    if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
      return Buffer.from(key, 'hex');
    }

    // Base64 -> check if decodes to 32 bytes
    const b64 = Buffer.from(key, 'base64');
    if (b64.length === 32) {
      return b64;
    }

    // Raw 32-byte UTF-8 string
    const utf8 = Buffer.from(key, 'utf8');
    if (utf8.length === 32) {
      return utf8;
    }

    throw new Error('APP_ENCRYPTION_KEY must be a 32-byte key (base64, hex, or raw 32 bytes)');
  }

  /**
   * Generates a 6-digit CSPRNG OTP code (100000 - 999999).
   */
  generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes the given OTP with scrypt and a 16-byte random salt.
   * Format output: `salt:hash` (both in hex).
   */
  async hashOtp(otp: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(otp, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Verifies an OTP against a stored `salt:hash` using timingSafeEqual.
   */
  async verifyOtpHash(otp: string, storedHash: string): Promise<boolean> {
    if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
      return false;
    }

    const [salt, expectedHashHex] = storedHash.split(':');
    if (!salt || !expectedHashHex) {
      return false;
    }

    try {
      const derivedKey = (await scryptAsync(otp, salt, 64)) as Buffer;
      const expectedBuffer = Buffer.from(expectedHashHex, 'hex');

      if (derivedKey.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(derivedKey, expectedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Encrypts a payload into AES-256-GCM format.
   * Output format: `base64(iv):base64(tag):base64(ciphertext)`
   * Produces a fresh random 16-byte IV on every call.
   */
  encryptPayload(payload: any): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const jsonStr = JSON.stringify(payload);

    const ciphertext = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
  }

  /**
   * Decrypts an AES-256-GCM encrypted payload and returns the parsed original object.
   */
  decryptPayload(cipherText: string): any {
    if (!cipherText || typeof cipherText !== 'string') {
      throw new Error('Invalid ciphertext input');
    }

    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format. Expected base64(iv):base64(tag):base64(ciphertext)');
    }

    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(dataB64, 'base64');

    const key = this.getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }
}
