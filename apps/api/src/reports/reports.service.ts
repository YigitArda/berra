import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const VALID_TYPES = new Set(['post', 'feed_post', 'feed_comment']);
const VALID_REASONS = new Set([
  'spam',
  'hakaret',
  'nefret_söylemi',
  'yanlış_bilgi',
  'uygunsuz_içerik',
  'telif_hakkı',
  'diğer',
]);

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async create(
    reporterId: number,
    payload: { target_type: string; target_id: number; reason: string },
  ) {
    if (!VALID_TYPES.has(payload.target_type)) {
      throw new BadRequestException('Geçersiz içerik türü.');
    }
    if (!VALID_REASONS.has(payload.reason)) {
      throw new BadRequestException('Geçersiz şikayet nedeni.');
    }
    if (!Number.isInteger(payload.target_id) || payload.target_id < 1) {
      throw new BadRequestException('Geçersiz içerik ID.');
    }

    await this.db.query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (reporter_id, target_type, target_id) DO NOTHING`,
      [reporterId, payload.target_type, payload.target_id, payload.reason],
    );

    return { ok: true };
  }
}
