import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../database/database.service';

type AuthUser = { id: number; username: string; role: 'user' | 'mod' | 'admin' };

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private signToken(user: AuthUser): string {
    return jwt.sign(user, this.configService.getOrThrow<string>('JWT_SECRET'), {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    });
  }

  async register(username: string, email: string, password: string) {
    const exists = await this.db.query<{ id: number }>(
      'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1',
      [email.toLowerCase(), username],
    );

    if (exists.rows.length > 0) {
      throw new ConflictException('Bu email veya kullanıcı adı zaten kayıtlı.');
    }

    const hash = await bcrypt.hash(password, 12);

    const { rows } = await this.db.query<AuthUser>(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, role`,
      [username, email.toLowerCase(), hash],
    );

    const user = rows[0];
    const token = this.signToken(user);

    return {
      message: 'Kayıt başarılı.',
      user,
      token,
    };
  }

  async login(email: string, password: string) {
    const { rows } = await this.db.query<{
      id: number;
      username: string;
      role: 'user' | 'mod' | 'admin';
      password_hash: string;
      is_banned: boolean;
    }>('SELECT id, username, role, password_hash, is_banned FROM users WHERE email = $1', [email.toLowerCase()]);

    if (rows.length === 0) {
      throw new UnauthorizedException('Email veya şifre hatalı.');
    }

    const user = rows[0];
    if (user.is_banned) {
      throw new ForbiddenException('Hesabınız askıya alınmış.');
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Email veya şifre hatalı.');
    }

    const token = this.signToken({ id: user.id, username: user.username, role: user.role });

    return {
      message: 'Giriş başarılı.',
      user: { id: user.id, username: user.username, role: user.role },
      token,
    };
  }

  async me(userId: number) {
    const { rows } = await this.db.query<{
      id: number;
      username: string;
      email: string;
      role: 'user' | 'mod' | 'admin';
      avatar_url: string | null;
      bio: string | null;
      created_at: string;
    }>(
      'SELECT id, username, email, role, avatar_url, bio, created_at FROM users WHERE id = $1',
      [userId],
    );

    if (!rows.length) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }

    return { user: rows[0] };
  }
  async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, this.configService.getOrThrow<string>('JWT_SECRET')) as AuthUser;

      const { rows } = await this.db.query<{ id: number; username: string; role: 'user' | 'mod' | 'admin'; is_banned: boolean }>(
        'SELECT id, username, role, is_banned FROM users WHERE id = $1',
        [decoded.id],
      );

      if (!rows.length || rows[0].is_banned) {
        throw new UnauthorizedException('Geçersiz oturum.');
      }

      const user = { id: rows[0].id, username: rows[0].username, role: rows[0].role };
      const newToken = this.signToken(user);

      return {
        message: 'Token yenilendi.',
        user,
        token: newToken,
      };
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş token.');
    }
  }

}
