import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import type { Response } from 'express';
import { DatabaseService } from '../../core/database/database.service';
import { OtpService } from '../../core/otp/otp.service';
import { GoogleAuthService } from '../auth/google-auth.service';
import {
  generateSessionToken,
  calculateSessionExpires,
  setSessionCookie,
} from '../../shared/utils/session.util';
import { CreateResellerInviteDto } from './dto/create-reseller-invite.dto';
import { ClaimInviteDto } from '../auth/dto/claim-invite.dto';

@Injectable()
export class ResellerInviteService {
  private readonly logger = new Logger(ResellerInviteService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly otpService: OtpService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  /**
   * Admin: Buat invite token baru
   */
  async createInvite(dto: CreateResellerInviteDto, adminUserId?: string) {
    if (!dto.partnerName || typeof dto.partnerName !== 'string' || dto.partnerName.trim() === '') {
      throw new BadRequestException('Nama mitra / partnerName wajib diisi.');
    }

    const partnerName = dto.partnerName.trim();
    const partnerPhone = dto.partnerPhone?.trim() || null;
    const roleToGrant = (dto.roleToGrant || 'reseller').trim();
    const expiresInHours = Math.min(720, Math.max(1, Number(dto.expiresInHours) || 48));

    // Validasi roleToGrant ada di master.t_mtr_roles
    const roleCheck = await this.db.query(
      'SELECT id, name FROM master.t_mtr_roles WHERE id = $1',
      [roleToGrant],
    );
    if (!roleCheck.rows || roleCheck.rows.length === 0) {
      throw new BadRequestException(`Role "${roleToGrant}" tidak valid atau tidak terdaftar.`);
    }

    // Generate 64-char URL-safe cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    const { rows } = await this.db.query(
      `INSERT INTO transaction.t_trx_reseller_invites
        (token, partner_name, partner_phone, role_to_grant, created_by, max_uses, used_count, expires_at, is_revoked)
       VALUES ($1, $2, $3, $4, $5, 1, 0, $6, FALSE)
       RETURNING id, token, partner_name, partner_phone, role_to_grant, max_uses, used_count, expires_at, created_at`,
      [token, partnerName, partnerPhone, roleToGrant, adminUserId || null, expiresAt],
    );

    const inv = rows[0];
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const inviteUrl = `${appUrl}/reseller/vip-join?token=${token}`;

    return {
      id: inv.id,
      token: inv.token,
      inviteUrl,
      partnerName: inv.partner_name,
      partnerPhone: inv.partner_phone,
      roleToGrant: inv.role_to_grant,
      expiresAt: inv.expires_at,
      maxUses: inv.max_uses,
      usedCount: inv.used_count,
      createdAt: inv.created_at,
    };
  }

  /**
   * Admin: List semua invite
   */
  async getInvites() {
    const { rows } = await this.db.query(
      `SELECT 
        i.id,
        i.token,
        i.partner_name,
        i.partner_phone,
        i.role_to_grant,
        i.created_by,
        i.max_uses,
        i.used_count,
        i.expires_at,
        i.claimed_at,
        i.claimed_by_user_id,
        i.is_revoked,
        i.created_at,
        u_creator.name AS creator_name,
        u_claimed.email AS claimed_by_email,
        u_claimed.name AS claimed_by_name,
        r.name AS role_name
       FROM transaction.t_trx_reseller_invites i
       LEFT JOIN master.t_mtr_users u_creator ON u_creator.id = i.created_by
       LEFT JOIN master.t_mtr_users u_claimed ON u_claimed.id = i.claimed_by_user_id
       LEFT JOIN master.t_mtr_roles r ON r.id = i.role_to_grant
       ORDER BY i.created_at DESC`,
    );

    const now = new Date();
    const invites = rows.map((row) => {
      let status: 'active' | 'claimed' | 'expired' | 'revoked' = 'active';
      if (row.is_revoked) {
        status = 'revoked';
      } else if (row.used_count >= row.max_uses || row.claimed_at !== null) {
        status = 'claimed';
      } else if (new Date(row.expires_at) < now) {
        status = 'expired';
      }

      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
      const inviteUrl = `${appUrl}/reseller/vip-join?token=${row.token}`;

      return {
        id: row.id,
        token: row.token,
        inviteUrl,
        partner_name: row.partner_name,
        partnerName: row.partner_name,
        partner_phone: row.partner_phone,
        partnerPhone: row.partner_phone,
        role_to_grant: row.role_to_grant,
        roleToGrant: row.role_to_grant,
        role_name: row.role_name,
        status,
        max_uses: row.max_uses,
        used_count: row.used_count,
        expires_at: row.expires_at,
        expiresAt: row.expires_at,
        claimed_at: row.claimed_at,
        claimedAt: row.claimed_at,
        claimed_by_email: row.claimed_by_email,
        claimed_by_name: row.claimed_by_name,
        creator_name: row.creator_name,
        is_revoked: row.is_revoked,
        isRevoked: row.is_revoked,
        created_at: row.created_at,
        createdAt: row.created_at,
      };
    });

    return { invites };
  }

  /**
   * Admin: Revoke (batalkan) invite
   */
  async revokeInvite(id: string) {
    const { rows } = await this.db.query(
      `UPDATE transaction.t_trx_reseller_invites
       SET is_revoked = TRUE
       WHERE id = $1
       RETURNING id, token, is_revoked`,
      [id],
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Undangan reseller tidak ditemukan.');
    }

    return {
      success: true,
      message: 'Undangan VIP Reseller berhasil dibatalkan.',
      invite: rows[0],
    };
  }

  /**
   * Public: Cek status token undangan
   */
  async getInviteInfo(token: string) {
    if (!token || typeof token !== 'string') {
      throw new NotFoundException('Token undangan tidak valid.');
    }
    const cleanToken = token.trim();

    const { rows } = await this.db.query(
      `SELECT inv.id, inv.token, inv.partner_name, inv.partner_phone, inv.role_to_grant,
              inv.max_uses, inv.used_count, inv.expires_at, inv.claimed_at, inv.is_revoked,
              COALESCE((
                SELECT dp.discount_value
                FROM master.t_mtr_discount_policies dp
                WHERE dp.is_active = TRUE
                  AND (dp.valid_from IS NULL OR dp.valid_from <= NOW())
                  AND (dp.valid_until IS NULL OR dp.valid_until >= NOW())
                  AND (dp.target_roles IS NULL OR inv.role_to_grant = ANY(dp.target_roles))
                ORDER BY dp.discount_value DESC
                LIMIT 1
              ), 0) AS discount_percent
       FROM transaction.t_trx_reseller_invites inv
       WHERE inv.token = $1`,
      [cleanToken],
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Token undangan tidak ditemukan atau tidak valid.');
    }

    const invite = rows[0];

    if (invite.is_revoked) {
      throw new HttpException('Token undangan telah dibatalkan oleh administrator.', HttpStatus.GONE);
    }

    if (invite.used_count >= invite.max_uses || invite.claimed_at !== null) {
      throw new HttpException('Token undangan sudah pernah diklaim sebelumnya.', HttpStatus.GONE);
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new HttpException('Masa berlaku token undangan telah kedaluwarsa.', HttpStatus.GONE);
    }

    return {
      valid: true,
      partnerName: invite.partner_name,
      expiresAt: invite.expires_at,
      roleToGrant: invite.role_to_grant,
      discount_percent: Number(invite.discount_percent || 0),
      discountPercent: Number(invite.discount_percent || 0),
    };
  }

  /**
   * Public: Klaim token undangan dengan Mandatory Fresh Re-Authentication
   */
  async claimInvite(dto: ClaimInviteDto, res: Response) {
    const token = String(dto.token || '').trim();
    if (!token) {
      throw new BadRequestException('Token undangan wajib disertakan.');
    }

    // 1. Cek kredensial re-autentikasi (Google ID token OR Email+Password)
    const googleToken = String(dto.credential || dto.idToken || '').trim();
    const email = String(dto.email || '').trim().toLowerCase();
    const password = String(dto.password || '');

    if (!googleToken && (!email || !password)) {
      throw new BadRequestException(
        'Autentikasi ulang wajib: Anda harus login ulang dengan Google atau Email & Password untuk mengklaim undangan VIP ini.',
      );
    }

    // 2. Query dan Lock record invite untuk mencegah race condition
    const { rows: inviteRows } = await this.db.query(
      `SELECT id, token, partner_name, role_to_grant, max_uses, used_count, expires_at, claimed_at, is_revoked
       FROM transaction.t_trx_reseller_invites
       WHERE token = $1
       FOR UPDATE`,
      [token],
    );

    if (!inviteRows || inviteRows.length === 0) {
      throw new NotFoundException('Token undangan tidak ditemukan.');
    }

    const invite = inviteRows[0];

    if (invite.is_revoked) {
      throw new HttpException('Token undangan telah dibatalkan.', HttpStatus.GONE);
    }

    if (invite.used_count >= invite.max_uses || invite.claimed_at !== null) {
      throw new HttpException('Token undangan sudah pernah digunakan.', HttpStatus.GONE);
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new HttpException('Token undangan telah kedaluwarsa.', HttpStatus.GONE);
    }

    let authenticatedUserId: string;
    let authenticatedUserEmail: string;
    let authenticatedUserName: string;

    // 3. Verifikasi Identitas Pengguna (Fresh Re-Authentication)
    if (googleToken) {
      const payload = await this.googleAuthService.verifyGoogleIdToken(
        googleToken,
        process.env.GOOGLE_CLIENT_ID,
      );

      const { sub, email: gEmail, name: gName } = payload;
      const normalizedEmail = gEmail.toLowerCase();

      // Cek apakah identity ada di master.t_mtr_user_identities
      const { rows: identRows } = await this.db.query(
        `SELECT u.id, u.name, u.email, u.role
         FROM master.t_mtr_user_identities i
         JOIN master.t_mtr_users u ON u.id = i.user_id
         WHERE i.provider = 'google' AND i.provider_user_id = $1`,
        [sub],
      );

      let targetUser = identRows[0];

      if (!targetUser) {
        // Cek user by email
        const { rows: userRows } = await this.db.query(
          'SELECT id, name, email, role FROM master.t_mtr_users WHERE email = $1',
          [normalizedEmail],
        );

        if (userRows.length > 0) {
          targetUser = userRows[0];
        } else {
          // Buat user baru dengan role target
          const { rows: newUserRows } = await this.db.query(
            `INSERT INTO master.t_mtr_users (name, email, password_hash, role)
             VALUES ($1, $2, NULL, $3)
             RETURNING id, name, email, role`,
            [gName || invite.partner_name, normalizedEmail, invite.role_to_grant],
          );
          targetUser = newUserRows[0];
        }

        // Tautkan identitas
        await this.db.query(
          `INSERT INTO master.t_mtr_user_identities (user_id, provider, provider_user_id)
           VALUES ($1, 'google', $2)
           ON CONFLICT (provider, provider_user_id) DO NOTHING`,
          [targetUser.id, sub],
        );
      }

      authenticatedUserId = targetUser.id;
      authenticatedUserEmail = targetUser.email;
      authenticatedUserName = targetUser.name;
    } else {
      // Verifikasi Email & Password
      const { rows: userRows } = await this.db.query(
        'SELECT id, name, email, role, password_hash FROM master.t_mtr_users WHERE email = $1',
        [email],
      );

      const existingUser = userRows[0];
      if (!existingUser || !existingUser.password_hash) {
        throw new UnauthorizedException('Email atau password tidak sesuai.');
      }

      const isMatch = await this.otpService.verifyOtpHash(password, existingUser.password_hash);
      if (!isMatch) {
        throw new UnauthorizedException('Email atau password tidak sesuai.');
      }

      authenticatedUserId = existingUser.id;
      authenticatedUserEmail = existingUser.email;
      authenticatedUserName = existingUser.name;
    }

    // 4. Upgrade Role Pengguna ke role_to_grant di master.t_mtr_users
    await this.db.query(
      `UPDATE master.t_mtr_users
       SET role = $1, updated_at = now()
       WHERE id = $2`,
      [invite.role_to_grant, authenticatedUserId],
    );

    // 5. Hanguskan token (Burn Token): used_count = 1, claimed_at = now(), claimed_by_user_id
    await this.db.query(
      `UPDATE transaction.t_trx_reseller_invites
       SET claimed_at = now(),
           claimed_by_user_id = $1,
           used_count = used_count + 1
       WHERE id = $2`,
      [authenticatedUserId, invite.id],
    );

    // 6. Terbitkan Sesi Baru & Pasang Cookie arm_session
    const sessionToken = generateSessionToken();
    const expires = calculateSessionExpires();
    await this.db.query(
      'INSERT INTO transaction.t_trx_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [sessionToken, authenticatedUserId, expires],
    );

    setSessionCookie(res, sessionToken, expires);

    this.logger.log(
      `VIP Invite claimed successfully: partner="${invite.partner_name}", user="${authenticatedUserEmail}", granted_role="${invite.role_to_grant}"`,
    );

    return {
      success: true,
      message: `Selamat! Kemitraan ${invite.partner_name} berhasil diaktivasi sebagai ${invite.role_to_grant}.`,
      user: {
        id: authenticatedUserId,
        name: authenticatedUserName,
        email: authenticatedUserEmail,
        role: invite.role_to_grant,
      },
    };
  }
}
