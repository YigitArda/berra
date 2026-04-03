import { Injectable } from '@nestjs/common';
import { sanitizeText } from '../common/utils/sanitize';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ContentService {
  constructor(private readonly db: DatabaseService) {}

  async list(page = 1) {
    const limit = 20;
    const offset = (page - 1) * limit;
    const { rows } = await this.db.query(
      `SELECT id, body, like_count, comment_count, created_at, user_id
       FROM feed_posts
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return { items: rows, page, limit };
  }

  async create(userId: number, body: string) {
    const cleanBody = sanitizeText(body, 500);
    const { rows } = await this.db.query(
      `INSERT INTO feed_posts (user_id, body)
       VALUES ($1, $2)
       RETURNING id, body, created_at`,
      [userId, cleanBody],
    );
    return { item: rows[0] };
  }
}
