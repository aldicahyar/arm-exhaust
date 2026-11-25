import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { VerifyService } from './verify.service';
import type { VerifyCertificateResponseDto } from './dto/verify-certificate-response.dto';
import { RateLimitGuard } from '../../shared/guards/rate-limit.guard';
import { RateLimit } from '../../shared/decorators/rate-limit.decorator';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Get(':serialNumber')
  @UseGuards(RateLimitGuard)
  @RateLimit('verify-serial')
  async verify(
    @Param('serialNumber') serialNumber: string,
    @Query('token') token?: string,
  ): Promise<VerifyCertificateResponseDto> {
    return this.verifyService.verifySerialNumber(serialNumber, token);
  }
}
