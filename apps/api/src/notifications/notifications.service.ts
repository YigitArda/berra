import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from '../realtime/notifications.gateway';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly queueService: QueueService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async sendSystemNotification(userId: number, message: string) {
    const job = await this.queueService.enqueueNotification({
      userId,
      type: 'system',
      message,
    });

    this.notificationsGateway.emitSystemNotification({ userId, message });

    return job;
  }

  async sendEmail(to: string, subject: string, html: string) {
    return this.queueService.enqueueEmail({ to, subject, html });
  }
}
