import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { MediaController } from './media.controller';
import { PublicContentController } from './public-content.controller';
import { AdminUsersService } from './admin-users.service';
import { ResellerInviteService } from './reseller-invite.service';
import { GoogleAuthService } from '../auth/google-auth.service';
import { MediaService } from './media.service';
import { ContentManagementService } from './content-management.service';

@Module({
  controllers: [AdminController, MediaController, PublicContentController],
  providers: [
    AdminUsersService,
    ResellerInviteService,
    GoogleAuthService,
    MediaService,
    ContentManagementService,
  ],
  exports: [AdminUsersService, ResellerInviteService, MediaService, ContentManagementService],
})
export class AdminModule {}
