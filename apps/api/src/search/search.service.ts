import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SearchService {
  constructor(private readonly db: DatabaseService) {}

  async searchThreads(query: string) {
    if (query.length < 2 || query.length > 200) return { results: [], query };

    const { rows } = await this.db.query(
      `SELECT
         t.id, t.title, t.slug, t.reply_count, t.view_count, t.created_at,
         u.username AS author,
         c.name AS category_name,
         ts_rank(to_tsvector('simple', COALESCE(t.title, '')), plainto_tsquery('simple', $1)) AS rank
       FROM threads t
       JOIN users u ON u.id = t.user_id
       JOIN categories c ON c.id = t.category_id
       WHERE
         to_tsvector('simple', COALESCE(t.title, '')) @@ plainto_tsquery('simple', $1)
         OR EXISTS (
           SELECT 1 FROM posts p
           WHERE p.thread_id = t.id
             AND p.is_deleted = false
             AND to_tsvector('simple', COALESCE(p.body, '')) @@ plainto_tsquery('simple', $1)
         )
       ORDER BY rank DESC, t.last_reply_at DESC NULLS LAST
       LIMIT 20`,
      [query],
    );

    return { results: rows, query };
  }
}
