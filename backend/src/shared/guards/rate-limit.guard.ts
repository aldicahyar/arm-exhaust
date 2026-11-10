import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService, cleanIp } from '../../core/security/rate-limiter.service';
import { RATE_LIMIT_ACTION_KEY } from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiterService: RateLimiterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action =
      this.reflector.getAllAndOverride<string>(RATE_LIMIT_ACTION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || 'default';

    const req = context.switchToHttp().getRequest();
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const ip = cleanIp(rawIp);

    const check = await this.rateLimiterService.checkRateLimit(ip, action);
    if (!check.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests from your device. Please wait a few moments before trying again.',
          error: 'Too Many Requests',
          retryAfterSec: check.retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
