import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('PrismaService connected to PostgreSQL database');
    } catch (err: any) {
      this.logger.error('Prisma connection error:', err?.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('PrismaService disconnected from database');
  }
}
