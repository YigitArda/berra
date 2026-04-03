import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async health() {
    let dbStatus: 'up' | 'down' = 'down';
    let redisStatus: 'up' | 'down' = 'down';

    try {
      await this.db.query('SELECT 1');
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    try {
      const redis = new IORedis(this.configService.get<string>('REDIS_URL', 'redis://127.0.0.1:6379'), {
        maxRetriesPerRequest: 1,
      });
      await redis.ping();
      redisStatus = 'up';
      await redis.quit();
    } catch {
      redisStatus = 'down';
    }

    return {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      service: 'berra-api',
      uptime: process.uptime(),
      checks: {
        db: dbStatus,
        redis: redisStatus,
      },
      ts: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics() {
    const lines = [
      '# HELP process_uptime_seconds Uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${process.uptime().toFixed(2)}`,
      '# HELP process_memory_rss_bytes Resident set size in bytes',
      '# TYPE process_memory_rss_bytes gauge',
      `process_memory_rss_bytes ${process.memoryUsage().rss}`,
    ];

    return lines.join('\n');
  }
}
