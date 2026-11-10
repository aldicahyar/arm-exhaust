import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminUsersService } from './admin-users.service';
import { ResellerInviteService } from './reseller-invite.service';
import { GoogleAuthService } from '../auth/google-auth.service';

@Module({
  controllers: [AdminController],
  providers: [AdminUsersService, ResellerInviteService, GoogleAuthService],
  exports: [AdminUsersService, ResellerInviteService],
})
export class AdminModule {}
