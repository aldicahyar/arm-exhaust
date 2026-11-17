import {
  Controller,
  Post,
  Get,
  Patch,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TurnstileGuard } from '../../shared/guards/turnstile.guard';
import { RateLimitGuard } from '../../shared/guards/rate-limit.guard';
import { SessionAuthGuard } from '../../shared/guards/session-auth.guard';
import { RateLimit } from '../../shared/decorators/rate-limit.decorator';
import { cleanIp } from '../../core/security/rate-limiter.service';

function getClientIp(req: Request): string {
  const raw =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1';
  return cleanIp(raw);
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TurnstileGuard, RateLimitGuard)
  @RateLimit('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = getClientIp(req);
    return this.authService.register(dto, ip);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('verify-otp')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = getClientIp(req);
    return this.authService.verifyOtp(dto, ip, res);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto, @Req() req: Request) {
    const ip = getClientIp(req);
    return this.authService.resendOtp(dto, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TurnstileGuard, RateLimitGuard)
  @RateLimit('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = getClientIp(req);
    return this.authService.login(dto, ip, res);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async google(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.googleLogin(dto, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(req, res);
  }

  @Get('me')
  async me(@Req() req: Request) {
    return this.authService.me(req);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TurnstileGuard, RateLimitGuard)
  @RateLimit('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ip = getClientIp(req);
    return this.authService.forgotPassword(dto, ip);
  }

  @Get('verify-reset-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('verify-reset-token')
  async verifyResetToken(@Query('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TurnstileGuard, RateLimitGuard)
  @RateLimit('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ip = getClientIp(req);
    return this.authService.resetPassword(dto, ip);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async changePassword(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.changePassword(req.user.id, dto, res);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async updateProfile(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }
}
