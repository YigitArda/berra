import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProfileService {
  constructor(private readonly db: DatabaseService) {}

  async me(userId: number) {
    const { rows } = await this.db.query(
      'SELECT id, username, email, role, avatar_url, bio, created_at FROM users WHERE id = $1',
      [userId],
    );

    if (!rows.length) throw new NotFoundException('Kullanıcı bulunamadı.');
    return { user: rows[0] };
  }

  async updateMe(userId: number, bio?: string) {
    await this.db.query('UPDATE users SET bio = $1, updated_at = NOW() WHERE id = $2', [bio ?? null, userId]);
    return { message: 'Profil güncellendi.' };
  }

  async byUsername(username: string) {
    const { rows } = await this.db.query(
      `SELECT id, username, bio, avatar_url, role, created_at
       FROM users WHERE username = $1`,
      [username],
    );

    if (!rows.length) throw new NotFoundException('Kullanıcı bulunamadı.');
    return { user: rows[0] };
  }
}
