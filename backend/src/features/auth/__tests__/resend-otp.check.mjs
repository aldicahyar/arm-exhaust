import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dtoPath = path.resolve(__dirname, '../dto/resend-otp.dto.ts');
const controllerPath = path.resolve(__dirname, '../auth.controller.ts');
const servicePath = path.resolve(__dirname, '../auth.service.ts');

console.log('[CHECK] Verifying POST /api/auth/resend-otp backend implementation...');

// 1. DTO existence and validation rules
assert.ok(fs.existsSync(dtoPath), 'resend-otp.dto.ts must exist');
const dtoContent = fs.readFileSync(dtoPath, 'utf8');
assert.ok(dtoContent.includes('export class ResendOtpDto'), 'Must export ResendOtpDto');
assert.ok(dtoContent.includes('IsEmail'), 'Must validate email format with @IsEmail()');

// 2. Controller endpoint definition
assert.ok(fs.existsSync(controllerPath), 'auth.controller.ts must exist');
const controllerContent = fs.readFileSync(controllerPath, 'utf8');
assert.ok(controllerContent.includes("resend-otp"), "auth.controller.ts must define 'resend-otp' route");
assert.ok(controllerContent.includes('resendOtp'), "auth.controller.ts must call authService.resendOtp");

// 3. Service implementation
assert.ok(fs.existsSync(servicePath), 'auth.service.ts must exist');
const serviceContent = fs.readFileSync(servicePath, 'utf8');
assert.ok(serviceContent.includes('async resendOtp('), 'auth.service.ts must implement resendOtp method');
assert.ok(
  serviceContent.includes('transaction.t_trx_registration_otps') &&
  serviceContent.includes('verified_at IS NULL'),
  'resendOtp must query pending unverified registration OTPs'
);
assert.ok(
  serviceContent.includes('sendOtpEmail'),
  'resendOtp must send email using mailerService.sendOtpEmail'
);

console.log('✅ [CHECK PASSED] Backend resend-otp implementation verified!');
