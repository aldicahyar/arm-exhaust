import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_ACTION_KEY = 'rateLimitAction';

/**
 * Decorator to set action identifier for RateLimitGuard.
 * e.g. @RateLimit('register') or @RateLimit('login')
 */
export const RateLimit = (action: string) => SetMetadata(RATE_LIMIT_ACTION_KEY, action);
