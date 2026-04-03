import { randomBytes } from 'crypto';
import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sanitizeText } from '../common/utils/sanitize';
import { DatabaseService } from '../database/database.service';

type AuthUser = { id: number; username: string; role: 'user' | 'mod' | 'admin' };

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private signAccessToken(user: AuthUser): string {
    return jwt.sign(user, this.configService.getOrThrow<string>('JWT_SECRET'), {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });
  }

  private async issueRefreshToken(userId: number, userAgent?: string, ipAddress?: string) {
    const raw = randomBytes(48).toString('hex');
    const hash = await bcrypt.hash(raw, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 gün

    await this.db.query(
      `INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, hash, userAgent || null, ipAddress || null, expiresAt],
    );

    return raw;
  }

  async register(username: string, email: string, password: string, userAgent?: string, ipAddress?: string) {
    const cleanUsername = sanitizeText(username, 40);
    const cleanEmail = sanitizeText(email, 200).toLowerCase();

    const exists = await this.db.query<{ id: number }>(
      'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1',
      [cleanEmail, cleanUsername],
    );

    if (exists.rows.length > 0) {
      throw new ConflictException('Bu email veya kullanıcı adı zaten kayıtlı.');
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await this.db.query<AuthUser>(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, role`,
      [cleanUsername, cleanEmail, hash],
    );

    const user = rows[0];
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id, userAgent, ipAddress);

    return { message: 'Kayıt başarılı.', user, accessToken, refreshToken };
  }

  async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    const cleanEmail = sanitizeText(email, 200).toLowerCase();
    const { rows } = await this.db.query<{
      id: number;
      username: string;
      role: 'user' | 'mod' | 'admin';
      password_hash: string;
      is_banned: boolean;
    }>('SELECT id, username, role, password_hash, is_banned FROM users WHERE email = $1', [cleanEmail]);

    if (!rows.length) throw new UnauthorizedException('Email veya şifre hatalı.');

    const row = rows[0];
    if (row.is_banned) throw new ForbiddenException('Hesabınız askıya alınmış.');

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) throw new UnauthorizedException('Email veya şifre hatalı.');

    const user = { id: row.id, username: row.username, role: row.role };
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id, userAgent, ipAddress);

    return { message: 'Giriş başarılı.', user, accessToken, refreshToken };
  }

  async refresh(rawRefreshToken: string) {
    const { rows } = await this.db.query<{
      id: number;
      user_id: number;
      refresh_token_hash: string;
      expires_at: string;
      revoked_at: string | null;
      username: string;
      role: 'user' | 'mod' | 'admin';
      is_banned: boolean;
    }>(
      `SELECT s.id, s.user_id, s.refresh_token_hash, s.expires_at, s.revoked_at,
              u.username, u.role, u.is_banned
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC
       LIMIT 100`,
    );

    const match = await this.findMatchingSession(rows, rawRefreshToken);
    if (!match) throw new UnauthorizedException('Geçersiz refresh token.');
    if (match.revoked_at) {
      await this.db.query('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [match.user_id]);
      throw new UnauthorizedException('Refresh token tekrar kullanımı algılandı. Lütfen tekrar giriş yapın.');
    }

    if (match.is_banned) throw new ForbiddenException('Hesabınız askıya alınmış.');
    if (new Date(match.expires_at).getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token süresi dolmuş.');
    }

    await this.db.query('UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1', [match.id]);

    const user = { id: match.user_id, username: match.username, role: match.role };
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(match.user_id);

    return { message: 'Token yenilendi.', user, accessToken, refreshToken };
  }

  private async findMatchingSession(
    sessions: Array<{ id: number; refresh_token_hash: string; [k: string]: unknown }>,
    rawRefreshToken: string,
  ) {
    for (const s of sessions) {
      const ok = await bcrypt.compare(rawRefreshToken, s.refresh_token_hash);
      if (ok) return s;
    }
    return null;
  }

  async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken) return { message: 'Çıkış yapıldı.' };

    const { rows } = await this.db.query<{ id: number; refresh_token_hash: string }>(
      'SELECT id, refresh_token_hash FROM user_sessions WHERE revoked_at IS NULL ORDER BY created_at DESC LIMIT 30',
    );

    for (const s of rows) {
      if (await bcrypt.compare(rawRefreshToken, s.refresh_token_hash)) {
        await this.db.query('UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1', [s.id]);
        break;
      }
    }

    return { message: 'Çıkış yapıldı.' };
  }

  async me(userId: number) {
    const { rows } = await this.db.query(
      'SELECT id, username, email, role, avatar_url, bio, created_at FROM users WHERE id = $1',
      [userId],
    );

    if (!rows.length) throw new UnauthorizedException('Kullanıcı bulunamadı.');
    return { user: rows[0] };
  }
}
