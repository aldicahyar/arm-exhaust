import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ResellerInviteService } from '../admin/reseller-invite.service';
import { ClaimInviteDto } from './dto/claim-invite.dto';

@Controller('reseller')
export class ResellerClaimController {
  constructor(private readonly resellerInviteService: ResellerInviteService) {}

  @Get('invite-info')
  async getInviteInfo(@Query('token') token: string) {
    return this.resellerInviteService.getInviteInfo(token);
  }

  @Post('claim-invite')
  @HttpCode(HttpStatus.OK)
  async claimInvite(
    @Body() dto: ClaimInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.resellerInviteService.claimInvite(dto, res);
  }
}
