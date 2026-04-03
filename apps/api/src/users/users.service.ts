import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async me(userId: number) {
    const { rows } = await this.db.query(
      'SELECT id, username, email, role, avatar_url, bio, created_at FROM users WHERE id = $1',
      [userId],
    );
    if (!rows.length) throw new NotFoundException('Kullanıcı bulunamadı.');
    return { user: rows[0] };
  }

  async byUsername(username: string) {
    const { rows } = await this.db.query(
      'SELECT id, username, role, avatar_url, bio, created_at FROM users WHERE username = $1',
      [username],
    );
    if (!rows.length) throw new NotFoundException('Kullanıcı bulunamadı.');
    return { user: rows[0] };
  }
}
