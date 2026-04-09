import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { SearchResponse } from '../shared';

@Injectable()
export class SearchService {
  constructor(private readonly db: DatabaseService) {}

  async searchThreads(query: string, filters?: string, page = 1): Promise<SearchResponse> {
    const limit = 20;

    if (query.length < 2 || query.length > 200) {
      return { results: [], query, page, total: 0, limit };
    }
    const offset = (page - 1) * limit;
    const filterParts = (filters || '').split(',').map((s) => s.trim()).filter(Boolean);

    const where: string[] = [
      `(
        t.search_vector @@ plainto_tsquery('simple', $1)
        OR EXISTS (
          SELECT 1 FROM posts p
          WHERE p.thread_id = t.id
            AND p.is_deleted = false
            AND p.search_vector @@ plainto_tsquery('simple', $1)
        )
      )`,
    ];

    const queryParams: unknown[] = [query, limit, offset];
    const countParams: unknown[] = [query];

    if (filterParts.length > 0) {
      queryParams.push(filterParts);
      countParams.push(filterParts);
      where.push(`c.slug = ANY($4)`);
    }

    const whereSql = where.join(' AND ');

    const { rows } = await this.db.query(
      `SELECT
         t.id, t.title, t.slug, t.reply_count, t.view_count, t.created_at,
         u.username AS author,
         c.name AS category_name,
         ts_rank(t.search_vector, plainto_tsquery('simple', $1))
         + (1.0 / (1 + EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 86400.0)) AS rank
       FROM threads t
       JOIN users u ON u.id = t.user_id
       JOIN categories c ON c.id = t.category_id
       WHERE ${whereSql}
       ORDER BY rank DESC, t.last_reply_at DESC NULLS LAST
       LIMIT $2 OFFSET $3`,
      queryParams,
    );

    const countRes = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)
       FROM threads t
       JOIN categories c ON c.id = t.category_id
       WHERE ${whereSql}`,
      countParams,
    );

    return {
      results: rows,
      query,
      page,
      total: parseInt(countRes.rows[0].count, 10),
      limit,
    };
  }
}
