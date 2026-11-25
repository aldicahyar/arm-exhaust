import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './features/auth/auth.module';
import { AdminModule } from './features/admin/admin.module';
import { CheckoutModule } from './features/checkout/checkout.module';
import { VerifyModule } from './features/verify/verify.module';
import { AccountDashboardModule } from './features/account/account-dashboard.module';

@Module({
  imports: [
    CoreModule,
    SharedModule,
    AuthModule,
    AdminModule,
    CheckoutModule,
    VerifyModule,
    AccountDashboardModule,
  ],
})
export class AppModule {}
