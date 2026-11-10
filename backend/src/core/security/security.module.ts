import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseModule } from '../database/database.module';
import { SecurityConfigService } from './security-config.service';
import { MailerService } from './mailer.service';
import { TurnstileService } from './turnstile.service';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    Reflector,
    SecurityConfigService,
    MailerService,
    TurnstileService,
    RateLimiterService,
  ],
  exports: [
    Reflector,
    SecurityConfigService,
    MailerService,
    TurnstileService,
    RateLimiterService,
  ],
})
export class SecurityModule {}
