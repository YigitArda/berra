import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class BusinessesService {
  constructor(private readonly db: DatabaseService) {}

  async list(city?: string, category?: string, page = 1) {
    const limit = 30;
    const offset = (page - 1) * limit;
    const params: unknown[] = ['approved'];
    let where = 'WHERE b.status = $1';

    if (city) {
      params.push(city);
      where += ` AND LOWER(b.city) = LOWER($${params.length})`;
    }
    if (category) {
      params.push(category);
      where += ` AND b.category = $${params.length}`;
    }

    params.push(limit, offset);
    const { rows } = await this.db.query(
      `SELECT b.*, u.username AS owner
       FROM businesses b
       LEFT JOIN users u ON u.id = b.user_id
       ${where}
       ORDER BY b.avg_rating DESC, b.review_count DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { businesses: rows, page, limit };
  }

  async create(
    userId: number,
    payload: { name: string; category: string; address: string; city: string; phone?: string },
  ) {
    let slug = toSlug(`${payload.name}-${payload.city}`);
    const existing = await this.db.query('SELECT id FROM businesses WHERE slug LIKE $1', [`${slug}%`]);
    if (existing.rows.length) {
      slug = `${slug}-${Date.now()}`;
    }

    const { rows } = await this.db.query(
      `INSERT INTO businesses
        (user_id, name, slug, category, address, city, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, slug`,
      [userId, payload.name, slug, payload.category, payload.address, payload.city, payload.phone || null],
    );

    const created = rows[0] as { slug?: string } | undefined;
    return { message: 'Isletme eklendi, onay bekleniyor.', slug: created?.slug };
  }
}
