import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleAuthService } from './google-auth.service';
import { ResellerClaimController } from './reseller-claim.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [AuthController, ResellerClaimController],
  providers: [
    AuthService,
    GoogleAuthService,
  ],
  exports: [
    AuthService,
    GoogleAuthService,
  ],
})
export class AuthModule {}
