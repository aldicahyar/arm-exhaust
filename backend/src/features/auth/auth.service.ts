import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DatabaseService } from '../../core/database/database.service';
import { OtpService } from '../../core/otp/otp.service';
import { SecurityConfigService } from '../../core/security/security-config.service';
import { RateLimiterService } from '../../core/security/rate-limiter.service';
import { MailerService } from '../../core/security/mailer.service';
import { GoogleAuthService } from './google-auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { validatePasswordPolicy } from '../../shared/utils/password-policy.util';
import {
  generateSessionToken,
  calculateSessionExpires,
  setSessionCookie,
  clearSessionCookie,
  extractSessionToken,
} from '../../shared/utils/session.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly otpService: OtpService,
    private readonly securityConfigService: SecurityConfigService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly mailerService: MailerService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  /**
   * Registrasi Tahap 1: Validasi password, cek eksistensi, enkripsi payload, generate & kirim OTP.
   */
  async register(dto: RegisterDto, ip: string): Promise<{ requiresOtp: true }> {
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;

    // 1. Validasi password policy
    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      throw new BadRequestException(passwordError);
    }

    // 2. Cek email terdaftar di master.t_mtr_users
    const existingUser = await this.db.query(
      'SELECT 1 FROM master.t_mtr_users WHERE email = $1',
      [email],
    );
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      throw new ConflictException('This email is already registered. Please sign in instead.');
    }

    // 3. Hash password dengan scrypt
    const passwordHash = await this.otpService.hashOtp(password);

    // 4. Generate OTP, hash OTP, enkripsi payload registrasi
    const otp = this.otpService.generateOtp();
    const otpHash = await this.otpService.hashOtp(otp);
    const encryptedPayload = this.otpService.encryptPayload({
      name,
      email,
      passwordHash,
    });

    // 5. Simpan OTP ke database dengan TTL dari master.t_mtr_app_config
    const ttlMinutes = await this.securityConfigService.get('otp.ttl_minutes');

    // Hapus OTP aktif yang belum terverifikasi untuk email ini
    await this.db.query(
      'DELETE FROM transaction.t_trx_registration_otps WHERE identifier = $1 AND verified_at IS NULL',
      [email],
    );

    await this.db.query(
      `INSERT INTO transaction.t_trx_registration_otps
        (identifier, otp_hash, payload_enc, attempts, request_count, locked_until, expires_at)
       VALUES ($1, $2, $3, 0, 1, NULL, now() + ($4 || ' minutes')::interval)`,
      [email, otpHash, encryptedPayload, ttlMinutes],
    );

    // 6. Kirim email OTP
    await this.mailerService.sendOtpEmail(email, otp);

    // 7. Kembalikan requiresOtp: true tanpa session atau cookie
    return { requiresOtp: true };
  }

  /**
   * Registrasi Tahap 2: Verifikasi OTP, dekripsi payload, buat user customer, terbitkan sesi.
   */
  async verifyOtp(
    dto: VerifyOtpDto,
    ip: string,
    res: Response,
  ): Promise<{ user: { name: string; email: string; role: string } }> {
    const email = dto.email.trim().toLowerCase();
    const otp = dto.otp.trim();

    // 1. Cari baris OTP aktif
    const result = await this.db.query(
      `SELECT id, identifier, otp_hash, payload_enc, attempts, locked_until, expires_at, verified_at,
              EXTRACT(EPOCH FROM (locked_until - now()))::int AS remaining_lock_sec,
              EXTRACT(EPOCH FROM (expires_at - now()))::int AS remaining_expire_sec
       FROM transaction.t_trx_registration_otps
       WHERE identifier = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email],
    );

    if (result.rowCount === 0) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    const row = result.rows[0];

    // Jika sudah expired atau sudah diverifikasi sebelumnya
    if (row.remaining_expire_sec !== null && row.remaining_expire_sec <= 0) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }
    if (row.verified_at !== null) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    // 2. Cek apakah OTP terkunci (locked_until > now())
    if (row.remaining_lock_sec !== null && row.remaining_lock_sec > 0) {
      throw new HttpException('Too many failed attempts. Try again later.', 423);
    }

    // 3. Verifikasi hash OTP
    const isOtpValid = await this.otpService.verifyOtpHash(otp, row.otp_hash);

    // 4. Jika OTP salah
    if (!isOtpValid) {
      const attempts = (row.attempts || 0) + 1;
      const maxAttempts = await this.securityConfigService.get('otp.max_attempts');
      const lockMinutes = await this.securityConfigService.get('otp.lock_minutes');

      if (attempts >= maxAttempts) {
        await this.db.query(
          `UPDATE transaction.t_trx_registration_otps
           SET attempts = $1, locked_until = now() + ($2 || ' minutes')::interval
           WHERE id = $3`,
          [attempts, lockMinutes, row.id],
        );
      } else {
        await this.db.query(
          `UPDATE transaction.t_trx_registration_otps
           SET attempts = $1
           WHERE id = $2`,
          [attempts, row.id],
        );
      }

      await this.rateLimiterService.sleepExponential(attempts);
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    // 5. Jika OTP benar
    // Tandai verified_at
    await this.db.query(
      'UPDATE transaction.t_trx_registration_otps SET verified_at = now() WHERE id = $1',
      [row.id],
    );

    // Dekripsi payload
    const payload = this.otpService.decryptPayload(row.payload_enc);
    const userName = payload.name;
    const userEmail = payload.email.toLowerCase();
    const userPasswordHash = payload.passwordHash || payload.password_hash;

    // Cek duplikasi user
    const checkUser = await this.db.query(
      'SELECT id FROM master.t_mtr_users WHERE email = $1',
      [userEmail],
    );
    if (checkUser.rowCount && checkUser.rowCount > 0) {
      throw new ConflictException('This email is already registered. Please sign in instead.');
    }

    // Insert user baru role 'customer'
    const { rows: newUsers } = await this.db.query(
      `INSERT INTO master.t_mtr_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, role`,
      [userName, userEmail, userPasswordHash],
    );
    const newUser = newUsers[0];

    // Buat sesi dan set cookie
    const sessionToken = generateSessionToken();
    const expires = calculateSessionExpires();
    await this.db.query(
      'INSERT INTO transaction.t_trx_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [sessionToken, newUser.id, expires],
    );

    setSessionCookie(res, sessionToken, expires);

    // Bersihkan OTP untuk email ini
    await this.db.query(
      'DELETE FROM transaction.t_trx_registration_otps WHERE identifier = $1',
      [userEmail],
    );

    return {
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  /**
   * Login dengan email & password
   */
  async login(
    dto: LoginDto,
    ip: string,
    res: Response,
  ): Promise<{ user: { name: string; email: string; role: string } }> {
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;

    const { rows } = await this.db.query(
      'SELECT id, name, email, role, password_hash FROM master.t_mtr_users WHERE email = $1',
      [email],
    );
    const user = rows[0];

    if (!user || !user.password_hash) {
      await this.rateLimiterService.sleepExponential(1);
      throw new UnauthorizedException('Incorrect email or password.');
    }

    const isMatch = await this.otpService.verifyOtpHash(password, user.password_hash);
    if (!isMatch) {
      await this.rateLimiterService.sleepExponential(1);
      throw new UnauthorizedException('Incorrect email or password.');
    }

    // Bersihkan session kedaluwarsa
    await this.db.query('DELETE FROM transaction.t_trx_sessions WHERE expires_at < now()');

    // Buat sesi baru
    const token = generateSessionToken();
    const expires = calculateSessionExpires();
    await this.db.query(
      'INSERT INTO transaction.t_trx_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [token, user.id, expires],
    );

    setSessionCookie(res, token, expires);

    return {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Login via Google ID Token
   */
  async googleLogin(
    dto: GoogleLoginDto,
    res: Response,
  ): Promise<{ user: { name: string; email: string; role: string } }> {
    const idToken = String(dto.credential ?? dto.idToken ?? '').trim();
    if (!idToken) {
      throw new BadRequestException('Google ID token is required.');
    }

    const payload = await this.googleAuthService.verifyGoogleIdToken(
      idToken,
      process.env.GOOGLE_CLIENT_ID,
    );

    const { sub, email, name } = payload;
    const normalizedEmail = email.toLowerCase();

    // 1. Cek t_mtr_user_identities
    const { rows: identRows } = await this.db.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM master.t_mtr_user_identities i
       JOIN master.t_mtr_users u ON u.id = i.user_id
       WHERE i.provider = 'google' AND i.provider_user_id = $1`,
      [sub],
    );

    let user = identRows[0];

    if (!user) {
      // 2. Cek user berdasarkan email
      const { rows: userRows } = await this.db.query(
        'SELECT id, name, email, role FROM master.t_mtr_users WHERE email = $1',
        [normalizedEmail],
      );

      if (userRows.length > 0) {
        user = userRows[0];
      } else {
        // 3. User baru: role 'customer', password_hash NULL
        const { rows: newUserRows } = await this.db.query(
          `INSERT INTO master.t_mtr_users (name, email, password_hash, role)
           VALUES ($1, $2, NULL, 'customer')
           RETURNING id, name, email, role`,
          [name || normalizedEmail, normalizedEmail],
        );
        user = newUserRows[0];
      }

      // Tautkan identitas
      await this.db.query(
        `INSERT INTO master.t_mtr_user_identities (user_id, provider, provider_user_id)
         VALUES ($1, 'google', $2)
         ON CONFLICT (provider, provider_user_id) DO NOTHING`,
        [user.id, sub],
      );
    }

    // Bersihkan sesi kedaluwarsa & buat sesi baru
    await this.db.query('DELETE FROM transaction.t_trx_sessions WHERE expires_at < now()');
    const token = generateSessionToken();
    const expires = calculateSessionExpires();
    await this.db.query(
      'INSERT INTO transaction.t_trx_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [token, user.id, expires],
    );

    setSessionCookie(res, token, expires);

    return {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Logout: hapus session dari DB & clear cookie
   */
  async logout(req: Request, res: Response): Promise<{ ok: boolean }> {
    const token = extractSessionToken(req);
    if (token) {
      await this.db.query('DELETE FROM transaction.t_trx_sessions WHERE token = $1', [token]);
    }
    clearSessionCookie(res);
    return { ok: true };
  }

  /**
   * Profil user yang sedang aktif
   */
  async me(req: Request): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      role_name?: string;
      can_access_admin?: boolean;
      can_access_b2b?: boolean;
      discount_percent?: number;
      badge_style?: any;
      roleDetails?: any;
      role_details?: any;
    } | null;
  }> {
    const token = extractSessionToken(req);
    if (!token) {
      return { user: null };
    }

    const { rows } = await this.db.query(
      `SELECT u.id, u.name, u.email, u.role,
              r.name as role_name, r.can_access_admin, r.can_access_b2b,
              r.badge_style,
              COALESCE((
                SELECT dp.discount_value
                FROM master.t_mtr_discount_policies dp
                WHERE dp.is_active = TRUE
                  AND (dp.valid_from IS NULL OR dp.valid_from <= NOW())
                  AND (dp.valid_until IS NULL OR dp.valid_until >= NOW())
                  AND (dp.target_roles IS NULL OR u.role = ANY(dp.target_roles))
                ORDER BY dp.discount_value DESC
                LIMIT 1
              ), 0) AS discount_percent
       FROM transaction.t_trx_sessions s
       JOIN master.t_mtr_users u ON u.id = s.user_id
       LEFT JOIN master.t_mtr_roles r ON r.id = u.role
       WHERE s.token = $1 AND s.expires_at > now()`,
      [token],
    );

    if (!rows || rows.length === 0) {
      return { user: null };
    }

    const row = rows[0];
    const roleDetails = {
      id: row.role,
      name: row.role_name ?? row.role,
      discount_percent: Number(row.discount_percent ?? 0),
      can_access_admin: Boolean(row.can_access_admin),
      can_access_b2b: Boolean(row.can_access_b2b),
      badge_style: row.badge_style,
    };

    return {
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        role_name: row.role_name ?? row.role,
        can_access_admin: Boolean(row.can_access_admin),
        can_access_b2b: Boolean(row.can_access_b2b),
        discount_percent: Number(row.discount_percent ?? 0),
        badge_style: row.badge_style,
        roleDetails,
        role_details: roleDetails,
      },
    };
  }
}
