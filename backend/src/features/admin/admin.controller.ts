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
import { SessionAuthGuard } from '../../shared/guards/session-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import {
  SecurityConfigService,
  SECURITY_CONFIG_SPECS,
} from '../../core/security/security-config.service';
import { AdminUsersService } from './admin-users.service';
import { ResellerInviteService } from './reseller-invite.service';
import { ContentManagementService } from './content-management.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateResellerInviteDto } from './dto/create-reseller-invite.dto';
import {
  CreateCampaignSlideDto,
  UpdateCampaignSlideDto,
  ReorderContentDto,
} from './dto/campaign-slide.dto';
import {
  CreateCommunityEventDto,
  UpdateCommunityEventDto,
} from './dto/community-event.dto';

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
@Roles('admin', 'superadmin')
export class AdminController {
  constructor(
    private readonly securityConfigService: SecurityConfigService,
    private readonly adminUsersService: AdminUsersService,
    private readonly resellerInviteService: ResellerInviteService,
    private readonly contentManagementService: ContentManagementService,
  ) {}

  @Get('users')
  @Roles('admin', 'superadmin')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminUsersService.getUsers({ search, role, page, limit });
  }

  @Patch('users/:id/role')
  @Roles('admin', 'superadmin')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: any,
  ) {
    return this.adminUsersService.updateUserRole(userId, dto, req.user);
  }

  @Get('roles')
  @Roles('admin', 'superadmin')
  async getRoles() {
    return this.adminUsersService.getMasterRoles();
  }

  @Post(['reseller-invites', 'invites'])
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  async createResellerInvite(
    @Body() dto: CreateResellerInviteDto,
    @Req() req: any,
  ) {
    return this.resellerInviteService.createInvite(dto, req.user?.id);
  }

  @Get(['reseller-invites', 'invites'])
  @Roles('admin', 'superadmin')
  async getResellerInvites() {
    return this.resellerInviteService.getInvites();
  }

  @Delete('reseller-invites/:id')
  @Roles('admin', 'superadmin')
  async revokeResellerInvite(@Param('id') id: string) {
    return this.resellerInviteService.revokeInvite(id);
  }

  @Post('reseller-invites/:id/revoke')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  async revokeResellerInvitePost(@Param('id') id: string) {
    return this.resellerInviteService.revokeInvite(id);
  }

  @Get(['config', 'security/config'])
  @Roles('superadmin')
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

  @Put(['config', 'security/config'])
  @Roles('superadmin')
  async updateConfig(@Body() body: any) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body harus berupa JSON object.');
    }

    // Kasus 1: Format tunggal { key: "...", value: 123 }
    if (typeof body.key === 'string' && body.value !== undefined) {
      const numVal = Number(body.value);
      if (Number.isNaN(numVal)) {
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

    // Validasi semua entri terlebih dahulu sebelum eksekusi asynchronous
    const validEntries: Array<[string, number]> = [];
    for (const [key, val] of entries) {
      if (key in SECURITY_CONFIG_SPECS) {
        const numVal = Number(val);
        if (Number.isNaN(numVal)) {
          throw new BadRequestException(`Nilai untuk ${key} harus berupa angka valid.`);
        }
        validEntries.push([key, numVal]);
      }
    }

    const updateResults = await Promise.all(
      validEntries.map(async ([key, numVal]) => {
        const effective = await this.securityConfigService.updateConfig(key, numVal);
        return [key, effective] as const;
      }),
    );

    const updated = Object.fromEntries(updateResults);

    return {
      success: true,
      updated,
      config: await this.securityConfigService.getConfig(),
    };
  }

  @Get('tax')
  @Roles('superadmin')
  async getTaxConfig() {
    return this.adminUsersService.getTaxConfig();
  }

  @Put('tax')
  @Roles('superadmin')
  async updateTaxConfig(@Body() body: any) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body harus berupa JSON object.');
    }
    const rawVal = body.taxPercent ?? body.tax_percent ?? body.value;
    if (rawVal === undefined || rawVal === null) {
      throw new BadRequestException('Field taxPercent atau tax_percent wajib disertakan.');
    }
    const numVal = Number(rawVal);
    if (Number.isNaN(numVal) || numVal < 0 || numVal > 100) {
      throw new BadRequestException('Persentase pajak harus berupa angka valid antara 0 dan 100.');
    }
    return this.adminUsersService.updateTaxConfig(body);
  }

  @Post('tax')
  @Roles('superadmin')
  async updateTaxConfigPost(@Body() body: any) {
    return this.updateTaxConfig(body);
  }

  @Get(['policies', 'policies/matrix'])
  @Roles('superadmin')
  async getPolicies() {
    return this.adminUsersService.getDiscountPolicies();
  }

  // ==========================================
  // Hero / Campaign Slides Endpoints
  // ==========================================
  @Get('hero-slides')
  @Roles('admin', 'superadmin')
  async getHeroSlides() {
    return this.contentManagementService.getAllHeroSlides();
  }

  @Post('hero-slides')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  async createHeroSlide(@Body() dto: CreateCampaignSlideDto) {
    return this.contentManagementService.createHeroSlide(dto);
  }

  @Patch('hero-slides/reorder')
  @Roles('admin', 'superadmin')
  async reorderHeroSlides(
    @Body() body: ReorderContentDto | { orderedIds: string[] } | string[],
  ) {
    const ids = Array.isArray(body) ? body : (body as any)?.orderedIds;
    return this.contentManagementService.reorderHeroSlides(ids);
  }

  @Put('hero-slides/:id')
  @Roles('admin', 'superadmin')
  async updateHeroSlide(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignSlideDto,
  ) {
    return this.contentManagementService.updateHeroSlide(id, dto);
  }

  @Patch('hero-slides/:id/toggle')
  @Roles('admin', 'superadmin')
  async toggleHeroSlideStatus(@Param('id') id: string) {
    return this.contentManagementService.toggleHeroSlideStatus(id);
  }

  @Delete('hero-slides/:id')
  @Roles('admin', 'superadmin')
  async deleteHeroSlide(@Param('id') id: string) {
    return this.contentManagementService.deleteHeroSlide(id);
  }

  // ==========================================
  // Community Events Endpoints
  // ==========================================
  @Get('community-events')
  @Roles('admin', 'superadmin')
  async getCommunityEvents() {
    return this.contentManagementService.getAllCommunityEvents();
  }

  @Post('community-events')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  async createCommunityEvent(@Body() dto: CreateCommunityEventDto) {
    return this.contentManagementService.createCommunityEvent(dto);
  }

  @Patch('community-events/reorder')
  @Roles('admin', 'superadmin')
  async reorderCommunityEvents(
    @Body() body: ReorderContentDto | { orderedIds: string[] } | string[],
  ) {
    const ids = Array.isArray(body) ? body : (body as any)?.orderedIds;
    return this.contentManagementService.reorderCommunityEvents(ids);
  }

  @Put('community-events/:id')
  @Roles('admin', 'superadmin')
  async updateCommunityEvent(
    @Param('id') id: string,
    @Body() dto: UpdateCommunityEventDto,
  ) {
    return this.contentManagementService.updateCommunityEvent(id, dto);
  }

  @Patch('community-events/:id/toggle')
  @Roles('admin', 'superadmin')
  async toggleCommunityEventStatus(@Param('id') id: string) {
    return this.contentManagementService.toggleCommunityEventStatus(id);
  }

  @Delete('community-events/:id')
  @Roles('admin', 'superadmin')
  async deleteCommunityEvent(@Param('id') id: string) {
    return this.contentManagementService.deleteCommunityEvent(id);
  }
}
