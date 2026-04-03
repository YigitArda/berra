import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DiscoveryService {
  constructor(private readonly db: DatabaseService) {}

  async listModels(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows } = await this.db.query(
      `SELECT id, brand, model, generation, slug, description, created_at
       FROM car_models
       ORDER BY brand ASC, model ASC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return { models: rows, page, limit };
  }

  async getModel(slug: string) {
    const modelRes = await this.db.query(
      `SELECT id, brand, model, generation, slug, description, created_at
       FROM car_models WHERE slug = $1`,
      [slug],
    );
    if (!modelRes.rows.length) throw new NotFoundException('Model bulunamadı.');
    const model = modelRes.rows[0] as { id: number; brand: string; model: string };

    const [threads, users, maintenance, galleries, score, issues] = await Promise.all([
      this.db.query(
        `SELECT t.id, t.title, t.slug, t.reply_count, t.view_count, t.created_at
         FROM thread_models tm
         JOIN threads t ON t.id = tm.thread_id
         WHERE tm.car_model_id = $1
         ORDER BY t.last_reply_at DESC NULLS LAST, t.created_at DESC
         LIMIT 30`,
        [model.id],
      ),
      this.db.query(
        `SELECT uc.id, uc.year, uc.notes, uc.is_current, u.username
         FROM user_cars uc
         JOIN users u ON u.id = uc.user_id
         WHERE LOWER(uc.brand) = LOWER($1) AND LOWER(uc.model) = LOWER($2)
         ORDER BY uc.is_current DESC, uc.year DESC
         LIMIT 30`,
        [model.brand, model.model],
      ),
      this.db.query(
        `SELECT ml.id, ml.type, ml.done_date, ml.done_km, ml.note, u.username
         FROM maintenance_logs ml
         JOIN user_cars uc ON uc.id = ml.car_id
         JOIN users u ON u.id = ml.user_id
         WHERE LOWER(uc.brand) = LOWER($1) AND LOWER(uc.model) = LOWER($2)
         ORDER BY ml.done_date DESC
         LIMIT 40`,
        [model.brand, model.model],
      ),
      this.db.query(
        `SELECT gp.id, gp.image_url, gp.caption, gp.like_count, gp.created_at, u.username
         FROM gallery_photos gp
         LEFT JOIN user_cars uc ON uc.id = gp.car_id
         JOIN users u ON u.id = gp.user_id
         WHERE LOWER(COALESCE(uc.brand, '')) = LOWER($1) AND LOWER(COALESCE(uc.model, '')) = LOWER($2)
         ORDER BY gp.created_at DESC
         LIMIT 40`,
        [model.brand, model.model],
      ),
      this.db.query(
        `SELECT ROUND(AVG(score)::numeric, 2) AS avg_score, COUNT(*)::int AS total_votes
         FROM car_scores
         WHERE LOWER(brand) = LOWER($1) AND LOWER(model) = LOWER($2)`,
        [model.brand, model.model],
      ),
      this.db.query(
        `SELECT id, title, body, severity, created_at
         FROM model_chronic_issues
         WHERE car_model_id = $1
         ORDER BY severity DESC, created_at DESC
         LIMIT 20`,
        [model.id],
      ),
    ]);

    return {
      model,
      threads: threads.rows,
      user_cars: users.rows,
      maintenance_logs: maintenance.rows,
      galleries: galleries.rows,
      score: score.rows[0],
      chronic_issues: issues.rows,
    };
  }

  async followThread(userId: number, threadId: number) {
    await this.db.query(
      `INSERT INTO thread_follows (user_id, thread_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, threadId],
    );
    return { ok: true };
  }

  async unfollowThread(userId: number, threadId: number) {
    await this.db.query('DELETE FROM thread_follows WHERE user_id = $1 AND thread_id = $2', [userId, threadId]);
    return { ok: true };
  }

  async followModel(userId: number, modelId: number) {
    await this.db.query(
      `INSERT INTO car_model_follows (user_id, car_model_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, modelId],
    );
    return { ok: true };
  }

  async unfollowModel(userId: number, modelId: number) {
    await this.db.query('DELETE FROM car_model_follows WHERE user_id = $1 AND car_model_id = $2', [userId, modelId]);
    return { ok: true };
  }
}
