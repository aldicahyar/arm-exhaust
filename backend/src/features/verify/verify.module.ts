import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [CoreModule, SharedModule],
  controllers: [VerifyController],
  providers: [VerifyService],
  exports: [VerifyService],
})
export class VerifyModule {}
