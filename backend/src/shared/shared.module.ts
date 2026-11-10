import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CoreModule } from '../core/core.module';
import { TurnstileGuard } from './guards/turnstile.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OptionalSessionAuthGuard } from './guards/optional-session-auth.guard';

@Global()
@Module({
  imports: [CoreModule],
  providers: [
    Reflector,
    TurnstileGuard,
    RateLimitGuard,
    SessionAuthGuard,
    RolesGuard,
    OptionalSessionAuthGuard,
  ],
  exports: [
    Reflector,
    TurnstileGuard,
    RateLimitGuard,
    SessionAuthGuard,
    RolesGuard,
    OptionalSessionAuthGuard,
  ],
})
export class SharedModule {}
