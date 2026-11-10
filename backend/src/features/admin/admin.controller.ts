import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionAuthGuard } from '../../shared/guards/session-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import {
  SecurityConfigService,
  SECURITY_CONFIG_SPECS,
} from '../../core/security/security-config.service';
import { AdminUsersService } from './admin-users.service';
import { ResellerInviteService } from './reseller-invite.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateResellerInviteDto } from './dto/create-reseller-invite.dto';

const CONFIG_LABELS: Record<string, string> = {
  'otp.ttl_minutes': 'Masa Berlaku OTP (Menit)',
  'otp.max_attempts': 'Batas Percobaan OTP Salah',
  'otp.lock_minutes': 'Durasi Penguncian OTP (Menit)',
  'ratelimit.max_requests': 'Maksimal Permintaan per Jendela',
  'ratelimit.window_minutes': 'Durasi Jendela Rate Limit (Menit)',
  'ratelimit.block_minutes': 'Durasi Blokir Pertama (Menit)',
  'ratelimit.repeat_window_minutes': 'Jendela Deteksi Pelanggaran Berulang (Menit)',
  'ratelimit.repeat_block_minutes': 'Durasi Blokir Pelanggaran Berulang (Menit)',
};

@Controller('admin')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly securityConfigService: SecurityConfigService,
    private readonly adminUsersService: AdminUsersService,
    private readonly resellerInviteService: ResellerInviteService,
  ) {}

  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminUsersService.getUsers({ search, role, page, limit });
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminUsersService.updateUserRole(userId, dto.role);
  }

  @Get('roles')
  async getRoles() {
    return this.adminUsersService.getMasterRoles();
  }

  @Post('reseller-invites')
  @HttpCode(HttpStatus.CREATED)
  async createResellerInvite(
    @Body() dto: CreateResellerInviteDto,
    @Req() req: any,
  ) {
    return this.resellerInviteService.createInvite(dto, req.user?.id);
  }

  @Get('reseller-invites')
  async getResellerInvites() {
    return this.resellerInviteService.getInvites();
  }

  @Delete('reseller-invites/:id')
  async revokeResellerInvite(@Param('id') id: string) {
    return this.resellerInviteService.revokeInvite(id);
  }

  @Post('reseller-invites/:id/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeResellerInvitePost(@Param('id') id: string) {
    return this.resellerInviteService.revokeInvite(id);
  }

  @Get('config')
  async getConfig() {
    const config = await this.securityConfigService.getConfig();
    const items = Object.entries(SECURITY_CONFIG_SPECS).map(([key, spec]) => ({
      key,
      value: config[key] ?? spec.default,
      label: CONFIG_LABELS[key] || key,
      min: spec.min,
      max: spec.max,
      default: spec.default,
    }));

    return {
      config,
      items,
    };
  }

  @Put('config')
  async updateConfig(@Body() body: any) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body harus berupa JSON object.');
    }

    // Kasus 1: Format tunggal { key: "...", value: 123 }
    if (typeof body.key === 'string' && body.value !== undefined) {
      const numVal = Number(body.value);
      if (isNaN(numVal)) {
        throw new BadRequestException(`Nilai untuk ${body.key} harus berupa angka valid.`);
      }
      const effective = await this.securityConfigService.updateConfig(body.key, numVal);
      return {
        success: true,
        key: body.key,
        value: effective,
        config: await this.securityConfigService.getConfig(),
      };
    }

    // Kasus 2: Format batch { "otp.ttl_minutes": 20, "otp.max_attempts": 5 }
    const entries = Object.entries(body);
    if (entries.length === 0) {
      throw new BadRequestException('Tidak ada konfigurasi yang disertakan untuk diperbarui.');
    }

    const updated: Record<string, number> = {};
    for (const [key, val] of entries) {
      if (key in SECURITY_CONFIG_SPECS) {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          throw new BadRequestException(`Nilai untuk ${key} harus berupa angka valid.`);
        }
        const effective = await this.securityConfigService.updateConfig(key, numVal);
        updated[key] = effective;
      }
    }

    return {
      success: true,
      updated,
      config: await this.securityConfigService.getConfig(),
    };
  }
}
