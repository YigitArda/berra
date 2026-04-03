import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly queueService: QueueService) {}

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
}
