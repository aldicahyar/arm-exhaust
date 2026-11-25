import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AccountDashboardService } from './account-dashboard.service';
import type { CustomerDashboardResponseDto } from './dto/customer-dashboard-response.dto';
import { SessionAuthGuard } from '../../shared/guards/session-auth.guard';

@Controller('account')
export class AccountDashboardController {
  constructor(private readonly dashboardService: AccountDashboardService) {}

  @Get('dashboard')
  @UseGuards(SessionAuthGuard)
  async getDashboard(
    @Req() req: Request & { user: { id: string } },
  ): Promise<CustomerDashboardResponseDto> {
    const userId = req.user?.id;
    return this.dashboardService.getDashboardData(userId);
  }
}
