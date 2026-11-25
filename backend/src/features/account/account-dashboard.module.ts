import { Module } from '@nestjs/common';
import { AccountDashboardController } from './account-dashboard.controller';
import { AccountDashboardService } from './account-dashboard.service';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [CoreModule, SharedModule],
  controllers: [AccountDashboardController],
  providers: [AccountDashboardService],
  exports: [AccountDashboardService],
})
export class AccountDashboardModule {}
