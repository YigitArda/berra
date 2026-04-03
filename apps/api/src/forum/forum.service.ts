import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

function slugifyTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class ForumService {
  constructor(private readonly db: DatabaseService) {}

  async threads(page: number, category?: string) {
    const limit = 20;
    const offset = (page - 1) * limit;
    const params: unknown[] = [limit, offset];
    let whereClause = '';

    if (category && category !== 'all') {
      const cat = await this.db.query('SELECT id FROM categories WHERE slug = $1', [category]);
      if (!cat.rows.length) {
        return { threads: [], page, limit };
      }
      whereClause = 'WHERE t.category_id = $3';
      params.push((cat.rows[0] as { id: number }).id);
    }

    const { rows } = await this.db.query(
      `SELECT t.id, t.title, t.slug, t.is_pinned, t.is_locked,
              t.view_count, t.reply_count, t.last_reply_at, t.created_at,
              u.username AS author
       FROM threads t
       JOIN users u ON u.id = t.user_id
       ${whereClause}
       ORDER BY t.is_pinned DESC, t.last_reply_at DESC NULLS LAST
       LIMIT $1 OFFSET $2`,
      params,
    );
    return { threads: rows, page, limit };
  }

  async threadDetail(slug: string, page: number) {
    const limit = 25;
    const offset = (page - 1) * limit;

    const threadRes = await this.db.query(
      `UPDATE threads SET view_count = view_count + 1
       WHERE slug = $1
       RETURNING id, title, slug, is_pinned, is_locked, view_count, reply_count, created_at`,
      [slug],
    );
    if (!threadRes.rows.length) throw new NotFoundException('Konu bulunamadı.');
    const thread = threadRes.rows[0] as {
      id: number;
      title: string;
      slug: string;
      is_pinned: boolean;
      is_locked: boolean;
      view_count: number;
      reply_count: number;
      created_at: string;
    };

    const [tagsRes, followersRes, postsRes] = await Promise.all([
      this.db.query(
        `SELECT tg.slug
         FROM thread_tags tt
         JOIN tags tg ON tg.id = tt.tag_id
         WHERE tt.thread_id = $1
         ORDER BY tg.usage_count DESC, tg.slug ASC`,
        [thread.id],
      ),
      this.db.query('SELECT COUNT(*)::int AS count FROM thread_follows WHERE thread_id = $1', [thread.id]),
      this.db.query(
        `SELECT p.id, p.body, p.like_count, p.is_deleted, p.created_at, p.updated_at,
                u.username, u.avatar_url, u.role
         FROM posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.thread_id = $1
         ORDER BY p.created_at ASC
         LIMIT $2 OFFSET $3`,
        [thread.id, limit, offset],
      ),
    ]);

    return {
      thread: {
        ...thread,
        tags: tagsRes.rows.map((t) => (t as { slug: string }).slug),
        followers: (followersRes.rows[0] as { count: number })?.count || 0,
      },
      posts: postsRes.rows,
      page,
      limit,
    };
  }

  async createThread(userId: number, payload: { title: string; body: string; category_id: number }) {
    let slug = slugifyTitle(payload.title);
    const existing = await this.db.query('SELECT id FROM threads WHERE slug LIKE $1', [`${slug}%`]);
    if (existing.rows.length) slug = `${slug}-${Date.now()}`;

    const threadRes = await this.db.query(
      `INSERT INTO threads (user_id, category_id, title, slug)
       VALUES ($1, $2, $3, $4)
       RETURNING id, slug`,
      [userId, payload.category_id, payload.title, slug],
    );
    const thread = threadRes.rows[0] as { id: number; slug: string };

    await this.db.query(
      `INSERT INTO posts (thread_id, user_id, body)
       VALUES ($1, $2, $3)`,
      [thread.id, userId, payload.body.trim()],
    );
    await this.db.query(
      `INSERT INTO thread_follows (user_id, thread_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, thread.id],
    );

    return { message: 'Konu açıldı.', slug: thread.slug };
  }

  async createPost(userId: number, slug: string, body: string) {
    const threadRes = await this.db.query('SELECT id, is_locked FROM threads WHERE slug = $1', [slug]);
    if (!threadRes.rows.length) throw new NotFoundException('Konu bulunamadı.');
    const thread = threadRes.rows[0] as { id: number; is_locked: boolean };
    if (thread.is_locked) return { error: 'Bu konu kilitli.' };

    const { rows } = await this.db.query(
      `INSERT INTO posts (thread_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, body, created_at`,
      [thread.id, userId, body.trim()],
    );
    return { post: rows[0] };
  }
}
