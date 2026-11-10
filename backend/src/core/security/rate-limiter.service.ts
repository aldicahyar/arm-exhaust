import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SecurityConfigService } from './security-config.service';

export function cleanIp(rawIp: string): string {
  if (!rawIp) return '127.0.0.1';
  let ip = rawIp.trim();
  if (ip === 'localhost') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  return ip;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: SecurityConfigService,
  ) {}

  /**
   * Checks whether an action from a given IP address is allowed or rate-limited.
   */
  async checkRateLimit(
    rawIp: string,
    action: string,
  ): Promise<{ allowed: boolean; retryAfterSec: number }> {
    const ip = cleanIp(rawIp);

    const maxRequestsRaw = await this.configService.get('ratelimit.max_requests');
    const isDev = process.env.NODE_ENV !== 'production';
    const isLoopback = ip === '127.0.0.1' || ip === '::1';
    const maxRequests = isDev && isLoopback ? Math.max(maxRequestsRaw, 100) : maxRequestsRaw;
    const windowMinutes = await this.configService.get('ratelimit.window_minutes');

    const result = await this.db.query(
      `SELECT
         window_start,
         count,
         violation_count,
         blocked_until,
         EXTRACT(EPOCH FROM (blocked_until - now()))::int AS remaining_block_sec,
         EXTRACT(EPOCH FROM (now() - window_start))::int AS window_elapsed_sec
       FROM transaction.t_trx_rate_limits
       WHERE ip_address = $1::inet AND action = $2`,
      [ip, action],
    );

    // If no record exists, insert initial request
    if (result.rowCount === 0) {
      await this.db.query(
        `INSERT INTO transaction.t_trx_rate_limits (ip_address, action, window_start, count, violation_count, blocked_until)
         VALUES ($1::inet, $2, now(), 1, 0, NULL)
         ON CONFLICT (ip_address, action) DO UPDATE SET count = transaction.t_trx_rate_limits.count + 1`,
        [ip, action],
      );
      return { allowed: true, retryAfterSec: 0 };
    }

    const row = result.rows[0];

    // 1. Check if IP is currently blocked
    if (row.remaining_block_sec !== null && row.remaining_block_sec > 0) {
      const retryAfterSec = Math.max(1, row.remaining_block_sec);
      return { allowed: false, retryAfterSec };
    }

    // 2. Check if current window has expired (or previous block has expired)
    const windowElapsedSec = row.window_elapsed_sec ?? 0;
    const windowExpired = windowElapsedSec >= windowMinutes * 60;

    if (windowExpired || (row.blocked_until && (row.remaining_block_sec === null || row.remaining_block_sec <= 0))) {
      await this.db.query(
        `UPDATE transaction.t_trx_rate_limits
         SET window_start = now(), count = 1, blocked_until = NULL
         WHERE ip_address = $1::inet AND action = $2`,
        [ip, action],
      );
      return { allowed: true, retryAfterSec: 0 };
    }

    // 3. Within current active window, check if limit will be exceeded
    if (row.count + 1 > maxRequests) {
      const retryAfterSec = await this.recordViolation(ip, action, row);
      return { allowed: false, retryAfterSec };
    }

    // 4. Increment count within safe limits
    await this.db.query(
      `UPDATE transaction.t_trx_rate_limits
       SET count = count + 1
       WHERE ip_address = $1::inet AND action = $2`,
      [ip, action],
    );

    return { allowed: true, retryAfterSec: 0 };
  }

  /**
   * Records a rate limit violation, increments violation_count, and sets blocked_until.
   * If repeated within repeat_window_minutes, applies repeat_block_minutes.
   */
  async recordViolation(ip: string, action: string, existingRow?: any): Promise<number> {
    const blockMinutes = await this.configService.get('ratelimit.block_minutes');
    const repeatWindowMinutes = await this.configService.get('ratelimit.repeat_window_minutes');
    const repeatBlockMinutes = await this.configService.get('ratelimit.repeat_block_minutes');

    let row = existingRow;
    if (!row) {
      const res = await this.db.query(
        `SELECT violation_count, window_start,
                EXTRACT(EPOCH FROM (now() - window_start))::int AS window_elapsed_sec
         FROM transaction.t_trx_rate_limits
         WHERE ip_address = $1::inet AND action = $2`,
        [ip, action],
      );
      row = res.rows[0];
    }

    const prevViolations = row?.violation_count ?? 0;
    const elapsedSec = row?.window_elapsed_sec ?? 0;
    const isRepeated = prevViolations > 0 && elapsedSec <= repeatWindowMinutes * 60;

    const newViolationCount = isRepeated ? prevViolations + 1 : 1;
    const blockDurationMinutes = isRepeated ? repeatBlockMinutes : blockMinutes;
    const blockDurationSec = blockDurationMinutes * 60;

    await this.db.query(
      `UPDATE transaction.t_trx_rate_limits
       SET violation_count = $3,
           blocked_until = now() + ($4 || ' minutes')::interval,
           count = count + 1
       WHERE ip_address = $1::inet AND action = $2`,
      [ip, action, newViolationCount, blockDurationMinutes],
    );

    this.logger.warn(
      `Rate limit violation recorded for IP ${ip} on action "${action}". Violation count: ${newViolationCount}. Blocked for ${blockDurationMinutes}m.`,
    );

    return blockDurationSec;
  }

  /**
   * Exponential backoff delay: Math.min(4000, 250 * Math.pow(2, attempt - 1)) ms
   */
  async sleepExponential(attempt: number): Promise<void> {
    const ms = Math.min(4000, 250 * Math.pow(2, Math.max(0, attempt - 1)));
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
