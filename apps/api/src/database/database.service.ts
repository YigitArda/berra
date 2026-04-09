import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
      ssl: this.configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
    });
  }

  query<T extends Record<string, any> = Record<string, any>>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
