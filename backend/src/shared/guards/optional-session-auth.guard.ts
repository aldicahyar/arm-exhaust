import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { extractSessionToken } from '../utils/session.util';

@Injectable()
export class OptionalSessionAuthGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = extractSessionToken(req);

    if (!token) {
      req.user = null;
      return true;
    }

    try {
      const { rows } = await this.db.query(
        `SELECT u.id, u.name, u.email, u.role,
                r.name as role_name, r.can_access_admin, r.can_access_b2b,
                r.badge_style
         FROM transaction.t_trx_sessions s
         JOIN master.t_mtr_users u ON u.id = s.user_id
         LEFT JOIN master.t_mtr_roles r ON r.id = u.role
         WHERE s.token = $1 AND s.expires_at > now()`,
        [token],
      );

      req.user = rows && rows.length > 0 ? rows[0] : null;
    } catch {
      req.user = null;
    }

    return true;
  }
}
