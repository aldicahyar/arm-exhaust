import { Injectable, Logger, Optional, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface SecurityConfigSpec {
  default: number;
  min: number;
  max: number;
}

export const SECURITY_CONFIG_SPECS: Record<string, SecurityConfigSpec> = {
  'otp.ttl_minutes': { default: 15, min: 5, max: 60 },
  'otp.max_attempts': { default: 3, min: 2, max: 10 },
  'otp.lock_minutes': { default: 5, min: 1, max: 60 },
  'ratelimit.max_requests': { default: 5, min: 3, max: 50 },
  'ratelimit.window_minutes': { default: 15, min: 5, max: 60 },
  'ratelimit.block_minutes': { default: 5, min: 1, max: 60 },
  'ratelimit.repeat_window_minutes': { default: 60, min: 10, max: 1440 },
  'ratelimit.repeat_block_minutes': { default: 60, min: 5, max: 60 },
};

@Injectable()
export class SecurityConfigService {
  private readonly logger = new Logger(SecurityConfigService.name);
  private cachedConfig: Record<string, number> | null = null;
  private lastCacheTime = 0;

  constructor(@Optional() private readonly dbService?: DatabaseService) {}

  /**
   * Helper to derive environment override key name.
   * e.g., 'otp.ttl_minutes' -> 'CONFIG_OVERRIDE_OTP_TTL_MINUTES'
   */
  private getEnvKey(key: string): string {
    return `CONFIG_OVERRIDE_${key.toUpperCase().replace(/\./g, '_')}`;
  }

  /**
   * Clamps a numeric value according to defined min/max specs.
   * If key is not in spec, returns rounded value or default.
   */
  clampConfig(key: string, val: number): number {
    const spec = SECURITY_CONFIG_SPECS[key];
    if (!spec) {
      return typeof val === 'number' && !isNaN(val) ? Math.round(val) : val;
    }

    const num = typeof val === 'number' && !isNaN(val) ? val : spec.default;
    return Math.min(spec.max, Math.max(spec.min, Math.round(num)));
  }

  /**
   * Resolves configuration with tiered hierarchy:
   * 1. Env override (e.g. CONFIG_OVERRIDE_OTP_TTL_MINUTES)
   * 2. DB master.t_mtr_app_config
   * 3. Hardcoded defaults
   * Results are cached for CONFIG_CACHE_TTL_MS (default 30 seconds).
   */
  async getConfig(): Promise<Record<string, number>> {
    const cacheTtlMs = Number(process.env.CONFIG_CACHE_TTL_MS ?? 30000);
    const now = Date.now();

    if (this.cachedConfig && now - this.lastCacheTime < cacheTtlMs) {
      return { ...this.cachedConfig };
    }

    // 1. Start with hardcoded defaults
    const resolved: Record<string, number> = {};
    for (const [key, spec] of Object.entries(SECURITY_CONFIG_SPECS)) {
      resolved[key] = spec.default;
    }

    // 2. Fetch from DB if DatabaseService is available
    if (this.dbService) {
      try {
        const result = await this.dbService.query<{ key: string; value: string }>(
          'SELECT key, value FROM master.t_mtr_app_config'
        );
        for (const row of result.rows) {
          if (row.key in SECURITY_CONFIG_SPECS) {
            const parsed = Number(row.value);
            if (!isNaN(parsed)) {
              resolved[row.key] = this.clampConfig(row.key, parsed);
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not read master.t_mtr_app_config from DB: ${err.message}. Using defaults/env.`);
      }
    }

    // 3. Apply Env Overrides (highest priority)
    for (const key of Object.keys(SECURITY_CONFIG_SPECS)) {
      const envVarName = this.getEnvKey(key);
      const envVal = process.env[envVarName];
      if (envVal !== undefined && envVal !== '') {
        const parsed = Number(envVal);
        if (!isNaN(parsed)) {
          resolved[key] = this.clampConfig(key, parsed);
        }
      }
    }

    // Ensure all values are clamped
    for (const [key, val] of Object.entries(resolved)) {
      resolved[key] = this.clampConfig(key, val);
    }

    this.cachedConfig = resolved;
    this.lastCacheTime = now;

    return { ...this.cachedConfig };
  }

  /**
   * Helper to retrieve a single configuration value by key.
   */
  async get(key: string): Promise<number> {
    const config = await this.getConfig();
    if (key in config) {
      return config[key];
    }
    const spec = SECURITY_CONFIG_SPECS[key];
    return spec ? spec.default : 0;
  }

  /**
   * Updates a configuration parameter in the database and invalidates the cache.
   * Clamps the value to the safe range defined in specifications.
   */
  async updateConfig(key: string, val: number): Promise<number> {
    if (!(key in SECURITY_CONFIG_SPECS)) {
      throw new BadRequestException(`Unknown configuration key: ${key}`);
    }

    if (typeof val !== 'number' || isNaN(val)) {
      throw new BadRequestException('Configuration value must be a valid number');
    }

    const clamped = this.clampConfig(key, val);

    if (this.dbService) {
      await this.dbService.query(
        `INSERT INTO master.t_mtr_app_config (key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = now()`,
        [key, clamped.toString()]
      );
    }

    // Invalidate in-memory cache
    this.cachedConfig = null;
    this.lastCacheTime = 0;

    return clamped;
  }
}
