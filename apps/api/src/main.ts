import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as cookie from '@fastify/cookie';
import * as helmet from '@fastify/helmet';
import * as rateLimit from '@fastify/rate-limit';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { validateEnv } from './config/env';
import { requestLogger } from './common/middleware/request-logger';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  await app.register(cookie as any);
  const isProd = process.env.NODE_ENV === 'production';
  await app.register(helmet as any, {
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
          },
        }
      : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  await app.register(rateLimit as any, {
    global: true,
    max: Number(process.env.RATE_LIMIT_MAX ?? 200),
    timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute',
  });

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? process.env.APP_URL ?? 'http://localhost:3000').split(',').map((v) => v.trim()),
    credentials: true,
  });

  app.use(requestLogger as never);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const host = configService.get<string>('HOST', '0.0.0.0');

  await app.listen(port, host);
}

bootstrap();
