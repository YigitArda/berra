import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { QueueService } from '../queue/queue.service';

type NotificationRow = {
  id: number;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly queueService: QueueService,
    private readonly db: DatabaseService,
  ) {}

  async sendSystemNotification(userId: number, message: string) {
    const job = await this.queueService.enqueueNotification({
      userId,
      type: 'system',
      message,
    });

    return job;
  }

  async sendEmail(to: string, subject: string, html: string) {
    return this.queueService.enqueueEmail({ to, subject, html });
  }

  async listForUser(userId: number, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [{ rows }, unread] = await Promise.all([
      this.db.query<NotificationRow>(
        `SELECT id, type, message, link, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      ),
      this.db.query<{ count: string }>(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId],
      ),
    ]);

    return {
      notifications: rows,
      unread: parseInt(unread.rows[0]?.count ?? '0', 10),
      page,
      limit,
    };
  }

  async markAllRead(userId: number) {
    await this.db.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [userId]);
    return { ok: true };
  }
}
