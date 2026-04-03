import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

type JwtPayload = { id: number; username: string; role: 'user' | 'mod' | 'admin' };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<FastifyRequest & { user?: JwtPayload }>();

    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.token ?? bearer;

    if (!token) {
      throw new UnauthorizedException('Giriş yapmanız gerekiyor.');
    }

    try {
      const decoded = jwt.verify(token, this.configService.getOrThrow<string>('JWT_SECRET')) as JwtPayload;
      req.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş oturum.');
    }
  }
}
