import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

export const PG_POOL = 'PG_POOL';

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: PG_POOL,
      useFactory: (dbService: DatabaseService) => dbService.getPool(),
      inject: [DatabaseService],
    },
  ],
  exports: [DatabaseService, PG_POOL],
})
export class DatabaseModule {}
