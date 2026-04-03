import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BookmarksService {
  constructor(private readonly db: DatabaseService) {}

  async list(userId: number, page: number) {
    const limit = 20;
    const offset = (page - 1) * limit;
    const { rows } = await this.db.query(
      `SELECT b.id AS bookmark_id, b.created_at AS saved_at,
              t.id, t.title, t.slug, t.reply_count, t.view_count, t.created_at,
              c.name AS category_name
       FROM bookmarks b
       JOIN threads t ON t.id = b.thread_id
       JOIN categories c ON c.id = t.category_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return { bookmarks: rows, page, limit };
  }

  async save(userId: number, threadId: number) {
    await this.db.query(
      'INSERT INTO bookmarks (user_id, thread_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, threadId],
    );
    return { message: 'Kaydedildi.' };
  }

  async remove(userId: number, threadId: number) {
    await this.db.query('DELETE FROM bookmarks WHERE user_id = $1 AND thread_id = $2', [userId, threadId]);
    return { message: 'Kayıt kaldırıldı.' };
  }
}
