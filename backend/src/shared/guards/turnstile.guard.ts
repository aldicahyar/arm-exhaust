import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { TurnstileService } from '../../core/security/turnstile.service';
import { cleanIp } from '../../core/security/rate-limiter.service';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstileService: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const token =
      req.body?.captchaToken ??
      req.body?.['cf-turnstile-response'] ??
      (req.headers['x-turnstile-token'] as string);

    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const ip = cleanIp(rawIp);

    const result = await this.turnstileService.verifyTurnstile(token, ip);
    if (!result.success) {
      throw new BadRequestException(result.error ?? 'Captcha verification failed.');
    }

    return true;
  }
}
