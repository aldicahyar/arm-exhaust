import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { PrismaModule } from './prisma/prisma.module';
import { OtpModule } from './otp/otp.module';
import { SecurityModule } from './security/security.module';

@Global()
@Module({
  imports: [
    DatabaseModule,
    PrismaModule,
    OtpModule,
    SecurityModule,
  ],
  exports: [
    DatabaseModule,
    PrismaModule,
    OtpModule,
    SecurityModule,
  ],
})
export class CoreModule {}
