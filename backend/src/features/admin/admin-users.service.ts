import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface GetUsersQuery {
  search?: string;
  role?: string;
  page?: number | string;
  limit?: number | string;
}

export interface UserRoleDetails {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number;
  can_access_admin: boolean;
  can_access_b2b: boolean;
  badge_style: any;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: Date;
  updated_at: Date;
  role_details: UserRoleDetails | null;
  roleDetails: UserRoleDetails | null;
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly db: DatabaseService) {}

  async getUsers(query: GetUsersQuery) {
    const page = Math.max(1, parseInt(String(query.page || 1), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10), 10) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (query.role && query.role.trim() !== '') {
      conditions.push(`u.role = $${idx++}`);
      values.push(query.role.trim());
    }

    if (query.search && query.search.trim() !== '') {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      values.push(`%${query.search.trim()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query Total Count
    const countSql = `SELECT COUNT(*)::int AS total FROM master.t_mtr_users u ${whereClause}`;
    const countRes = await this.db.query(countSql, values);
    const total = countRes.rows[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Query Paginated Users with Role Info
    const selectSql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        r.name AS role_name,
        r.description AS role_description,
        COALESCE((
          SELECT dp.discount_value
          FROM master.t_mtr_discount_policies dp
          WHERE dp.is_active = TRUE
            AND (dp.valid_from IS NULL OR dp.valid_from <= NOW())
            AND (dp.valid_until IS NULL OR dp.valid_until >= NOW())
            AND (dp.target_roles IS NULL OR u.role = ANY(dp.target_roles))
          ORDER BY dp.discount_value DESC
          LIMIT 1
        ), 0) AS discount_percent,
        r.can_access_admin,
        r.can_access_b2b,
        r.badge_style
      FROM master.t_mtr_users u
      LEFT JOIN master.t_mtr_roles r ON r.id = u.role
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const selectValues = [...values, limit, offset];
    const { rows } = await this.db.query(selectSql, selectValues);

    const users: AdminUserListItem[] = rows.map((row) => {
      const details: UserRoleDetails = {
        id: row.role,
        name: row.role_name ?? row.role,
        description: row.role_description ?? null,
        discount_percent: Number(row.discount_percent ?? 0),
        can_access_admin: Boolean(row.can_access_admin),
        can_access_b2b: Boolean(row.can_access_b2b),
        badge_style: row.badge_style ?? null,
      };

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        created_at: row.created_at,
        updated_at: row.updated_at,
        role_details: details,
        roleDetails: details,
      };
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async updateUserRole(
    userId: string,
    dtoOrRole: string | { role: string },
    currentUser?: any,
  ) {
    const newRole = typeof dtoOrRole === 'object' && dtoOrRole ? dtoOrRole.role : dtoOrRole;
    if (!newRole || typeof newRole !== 'string') {
      throw new BadRequestException('Role harus diisi.');
    }
    const cleanRole = newRole.trim();

    // 1. Validasi apakah role terdaftar di master.t_mtr_roles
    const roleCheck = await this.db.query(
      `SELECT r.id, r.name, r.description, r.can_access_admin, r.can_access_b2b, r.badge_style,
              COALESCE((
                SELECT dp.discount_value
                FROM master.t_mtr_discount_policies dp
                WHERE dp.is_active = TRUE
                  AND (dp.valid_from IS NULL OR dp.valid_from <= NOW())
                  AND (dp.valid_until IS NULL OR dp.valid_until >= NOW())
                  AND (dp.target_roles IS NULL OR r.id = ANY(dp.target_roles))
                ORDER BY dp.discount_value DESC
                LIMIT 1
              ), 0) AS discount_percent
       FROM master.t_mtr_roles r WHERE r.id = $1`,
      [cleanRole],
    );

    if (!roleCheck.rows || roleCheck.rows.length === 0) {
      throw new BadRequestException(`Role "${cleanRole}" tidak valid atau tidak terdaftar di sistem master.`);
    }

    const roleInfo = roleCheck.rows[0];

    // 2. Cek apakah user ada
    const userCheck = await this.db.query(
      'SELECT id, name, email, role FROM master.t_mtr_users WHERE id = $1',
      [userId],
    );

    if (!userCheck.rows || userCheck.rows.length === 0) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const targetUser = userCheck.rows[0];

    // Privilege Escalation Check:
    // If target user is currently superadmin OR the new role is superadmin:
    // Enforce currentUser.role === 'superadmin'
    if (targetUser.role === 'superadmin' || cleanRole === 'superadmin') {
      if (!currentUser || currentUser.role !== 'superadmin') {
        throw new ForbiddenException('Hanya superadmin yang dapat mengubah atau menetapkan role superadmin.');
      }
    }

    // 3. Update role user di master.t_mtr_users
    const { rows } = await this.db.query(
      `UPDATE master.t_mtr_users
       SET role = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, name, email, role, created_at, updated_at`,
      [cleanRole, userId],
    );

    const updatedUser = rows[0];
    const details: UserRoleDetails = {
      id: roleInfo.id,
      name: roleInfo.name,
      description: roleInfo.description,
      discount_percent: Number(roleInfo.discount_percent ?? 0),
      can_access_admin: Boolean(roleInfo.can_access_admin),
      can_access_b2b: Boolean(roleInfo.can_access_b2b),
      badge_style: roleInfo.badge_style,
    };

    return {
      success: true,
      message: `Role pengguna berhasil diubah menjadi ${roleInfo.name}.`,
      user: {
        ...updatedUser,
        role_details: details,
        roleDetails: details,
      },
    };
  }

  async getMasterRoles() {
    const { rows } = await this.db.query(
      `SELECT r.id, r.name, r.description, r.can_access_admin, r.can_access_b2b, r.badge_style,
              COALESCE((
                SELECT dp.discount_value
                FROM master.t_mtr_discount_policies dp
                WHERE dp.is_active = TRUE
                  AND (dp.valid_from IS NULL OR dp.valid_from <= NOW())
                  AND (dp.valid_until IS NULL OR dp.valid_until >= NOW())
                  AND (dp.target_roles IS NULL OR r.id = ANY(dp.target_roles))
                ORDER BY dp.discount_value DESC
                LIMIT 1
              ), 0) AS discount_percent
       FROM master.t_mtr_roles r
       ORDER BY r.id ASC`,
    );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      discount_percent: Number(r.discount_percent ?? 0),
      can_access_admin: r.can_access_admin,
      can_access_b2b: r.can_access_b2b,
      badge_style: r.badge_style,
    }));
  }

  async getTaxConfig(): Promise<any> {
    try {
      const { rows } = await this.db.query(
        `SELECT value FROM master.t_mtr_app_config WHERE key = 'finance.tax_config'`,
      );
      if (rows && rows.length > 0 && rows[0].value) {
        const parsed = JSON.parse(rows[0].value);
        const taxPercent = Number(parsed.taxPercent ?? parsed.tax_percent ?? 11);
        return {
          key: 'finance.tax_config',
          taxPercent: isNaN(taxPercent) ? 11 : taxPercent,
          tax_percent: isNaN(taxPercent) ? 11 : taxPercent,
          companyName: parsed.companyName ?? 'PT ARM Karya Knalpot Indonesia',
          companyNpwp: parsed.companyNpwp ?? '01.234.567.8-901.000',
          nppkp: parsed.nppkp ?? parsed.pkpNumber ?? 'S-123PKP/WPJ.08/KP.0303/2024',
          pkpNumber: parsed.pkpNumber ?? parsed.nppkp ?? 'S-123PKP/WPJ.08/KP.0303/2024',
          taxMode: parsed.taxMode ?? 'include',
          autoFakturB2B: typeof parsed.autoFakturB2B === 'boolean' ? parsed.autoFakturB2B : true,
          address: parsed.address ?? parsed.companyAddress ?? 'Kawasan Industri Manufaktur Knalpot No. 88, Purbalingga, Jawa Tengah 53311',
          companyAddress: parsed.companyAddress ?? parsed.address ?? 'Kawasan Industri Manufaktur Knalpot No. 88, Purbalingga, Jawa Tengah 53311',
          nsfpPrefix: parsed.nsfpPrefix ?? parsed.fakturPrefix ?? '010.000-26.',
          fakturPrefix: parsed.fakturPrefix ?? parsed.nsfpPrefix ?? '010.000-26.',
          updatedAt: parsed.updatedAt,
        };
      }
    } catch {
      // Ignore JSON parse error and fallback
    }

    const { rows } = await this.db.query(
      `SELECT value FROM master.t_mtr_app_config WHERE key = 'finance.tax_percent'`,
    );
    let taxPercent = 11;
    if (rows && rows.length > 0 && rows[0].value !== null && rows[0].value !== undefined) {
      const parsed = Number(rows[0].value);
      if (!isNaN(parsed)) {
        taxPercent = parsed;
      }
    }
    return {
      key: 'finance.tax_config',
      taxPercent,
      tax_percent: taxPercent,
      companyName: 'PT ARM Karya Knalpot Indonesia',
      companyNpwp: '01.234.567.8-901.000',
      nppkp: 'S-123PKP/WPJ.08/KP.0303/2024',
      pkpNumber: 'S-123PKP/WPJ.08/KP.0303/2024',
      taxMode: 'include',
      autoFakturB2B: true,
      address: 'Kawasan Industri Manufaktur Knalpot No. 88, Purbalingga, Jawa Tengah 53311',
      companyAddress: 'Kawasan Industri Manufaktur Knalpot No. 88, Purbalingga, Jawa Tengah 53311',
      nsfpPrefix: '010.000-26.',
      fakturPrefix: '010.000-26.',
    };
  }

  async updateTaxConfig(dto: any): Promise<any> {
    let taxPercent = 11;
    let configObj: any = {};

    if (typeof dto === 'number') {
      taxPercent = dto;
      configObj = { taxPercent };
    } else if (typeof dto === 'object' && dto !== null) {
      const rawVal = dto.taxPercent ?? dto.tax_percent ?? dto.value;
      taxPercent = Number(rawVal);
      configObj = { ...dto, taxPercent };
    }

    if (isNaN(taxPercent) || taxPercent < 0 || taxPercent > 100) {
      throw new BadRequestException('Persentase pajak harus berupa angka valid antara 0 dan 100.');
    }

    // Read existing finance.tax_config if available to preserve existing fields
    let existingConfig: any = {};
    try {
      const existing = await this.db.query(
        `SELECT value FROM master.t_mtr_app_config WHERE key = 'finance.tax_config'`,
      );
      if (existing.rows && existing.rows.length > 0 && existing.rows[0].value) {
        existingConfig = JSON.parse(existing.rows[0].value);
      }
    } catch {
      // fallback
    }

    const companyName = configObj.companyName ?? existingConfig.companyName ?? 'PT ARM Karya Knalpot Indonesia';
    const companyNpwp = configObj.companyNpwp ?? existingConfig.companyNpwp ?? '01.234.567.8-901.000';
    const nppkp = configObj.nppkp ?? configObj.pkpNumber ?? existingConfig.nppkp ?? existingConfig.pkpNumber ?? 'S-123PKP/WPJ.08/KP.0303/2024';
    const taxMode = configObj.taxMode ?? existingConfig.taxMode ?? 'include';
    const autoFakturB2B = typeof configObj.autoFakturB2B === 'boolean'
      ? configObj.autoFakturB2B
      : (typeof existingConfig.autoFakturB2B === 'boolean' ? existingConfig.autoFakturB2B : true);
    const address = configObj.address ?? configObj.companyAddress ?? existingConfig.address ?? existingConfig.companyAddress ?? 'Kawasan Industri Manufaktur Knalpot No. 88, Purbalingga, Jawa Tengah 53311';
    const nsfpPrefix = configObj.nsfpPrefix ?? configObj.fakturPrefix ?? existingConfig.nsfpPrefix ?? existingConfig.fakturPrefix ?? '010.000-26.';

    const fullTaxConfig = {
      taxPercent,
      tax_percent: taxPercent,
      companyName,
      companyNpwp,
      nppkp,
      pkpNumber: nppkp,
      taxMode,
      autoFakturB2B,
      address,
      companyAddress: address,
      nsfpPrefix,
      fakturPrefix: nsfpPrefix,
      updatedAt: new Date().toISOString(),
    };

    // Save full JSON to finance.tax_config
    await this.db.query(
      `INSERT INTO master.t_mtr_app_config (key, value, updated_at)
       VALUES ('finance.tax_config', $1, now())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = now()`,
      [JSON.stringify(fullTaxConfig)],
    );

    // Also update finance.tax_percent for backward compatibility
    await this.db.query(
      `INSERT INTO master.t_mtr_app_config (key, value, updated_at)
       VALUES ('finance.tax_percent', $1, now())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = now()`,
      [taxPercent.toString()],
    );

    return {
      success: true,
      key: 'finance.tax_config',
      ...fullTaxConfig,
      message: 'Konfigurasi tarif PPN dan identitas perpajakan berhasil diperbarui.',
    };
  }

  async getDiscountPolicies() {
    const { rows } = await this.db.query(
      `SELECT * FROM master.t_mtr_discount_policies ORDER BY priority DESC, id ASC`,
    );
    return {
      success: true,
      policies: rows,
    };
  }
}
