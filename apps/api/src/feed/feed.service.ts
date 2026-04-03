import { Injectable, NotFoundException } from '@nestjs/common';
import { sanitizeText } from '../common/utils/sanitize';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FeedService {
  constructor(private readonly db: DatabaseService) {}

  async list(page = 1) {
    const limit = 30;
    const offset = (page - 1) * limit;

    const [{ rows }, totalRes] = await Promise.all([
      this.db.query<{
        id: number;
        body: string;
        like_count: number;
        comment_count: number;
        created_at: string;
        username: string;
        avatar_url: string | null;
      }>(
        `SELECT
           f.id, f.body, f.like_count, f.comment_count, f.created_at,
           u.username, u.avatar_url
         FROM feed_posts f
         JOIN users u ON u.id = f.user_id
         ORDER BY f.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.db.query<{ count: string }>('SELECT COUNT(*) FROM feed_posts'),
    ]);

    return { posts: rows, page, limit, total: parseInt(totalRes.rows[0].count, 10) };
  }

  async create(userId: number, body: string) {
    const cleanBody = sanitizeText(body, 500);
    const { rows } = await this.db.query<{
      id: number;
      body: string;
      created_at: string;
    }>(
      `INSERT INTO feed_posts (user_id, body)
       VALUES ($1, $2)
       RETURNING id, body, created_at`,
      [userId, cleanBody],
    );

    return { post: rows[0] };
  }

  async like(feedId: number, userId: number) {
    const existing = await this.db.query(
      'INSERT INTO feed_likes (user_id, feed_post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [userId, feedId],
    );

    if (existing.rows.length > 0) {
      await this.db.query('UPDATE feed_posts SET like_count = like_count + 1 WHERE id = $1', [feedId]);
    }

    const { rows } = await this.db.query<{ like_count: number }>('SELECT like_count FROM feed_posts WHERE id = $1', [feedId]);
    if (!rows.length) throw new NotFoundException('Gönderi bulunamadı.');

    return { like_count: rows[0].like_count };
  }

  async unlike(feedId: number, userId: number) {
    const existing = await this.db.query(
      'DELETE FROM feed_likes WHERE user_id = $1 AND feed_post_id = $2 RETURNING *',
      [userId, feedId],
    );

    if (existing.rows.length > 0) {
      await this.db.query('UPDATE feed_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1', [feedId]);
    }

    const { rows } = await this.db.query<{ like_count: number }>('SELECT like_count FROM feed_posts WHERE id = $1', [feedId]);
    if (!rows.length) throw new NotFoundException('Gönderi bulunamadı.');

    return { like_count: rows[0].like_count };
  }

  async comments(feedId: number) {
    const { rows } = await this.db.query<{
      id: number;
      body: string;
      created_at: string;
      username: string;
      avatar_url: string | null;
    }>(
      `SELECT fc.id, fc.body, fc.created_at, u.username, u.avatar_url
       FROM feed_comments fc
       JOIN users u ON u.id = fc.user_id
       WHERE fc.feed_post_id = $1
       ORDER BY fc.created_at ASC`,
      [feedId],
    );

    return { comments: rows };
  }

  async createComment(feedId: number, userId: number, text: string, username: string) {
    const cleanText = sanitizeText(text, 300);
    const post = await this.db.query<{ id: number }>('SELECT id FROM feed_posts WHERE id = $1', [feedId]);
    if (!post.rows.length) throw new NotFoundException('Gönderi bulunamadı.');

    const { rows } = await this.db.query<{
      id: number;
      body: string;
      created_at: string;
    }>(
      `INSERT INTO feed_comments (feed_post_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, body, created_at`,
      [feedId, userId, cleanText],
    );

    await this.db.query('UPDATE feed_posts SET comment_count = comment_count + 1 WHERE id = $1', [feedId]);

    return {
      comment: {
        ...rows[0],
        username,
      },
    };
  }
}
