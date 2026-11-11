import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import pg, { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      this.logger.warn('DATABASE_URL is not set in environment variables');
    }

    this.pool = new pg.Pool({
      connectionString,
    });

    // Set search_path agar otomatis memprioritaskan skema transaction dan master
    this.pool.on('connect', (client) => {
      void client.query('SET search_path TO transaction, master').catch((err) => {
        this.logger.error('Failed to set search_path on client connection', err);
      });
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle PostgreSQL client', err);
    });

    this.logger.log('DatabaseService initialized with PostgreSQL connection pool');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('DatabaseService PostgreSQL pool has been closed');
    }
  }

  getPool(): Pool {
    return this.pool;
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }
}
