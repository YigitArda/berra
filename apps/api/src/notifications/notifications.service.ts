import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly queueService: QueueService) {}

  async sendSystemNotification(userId: number, message: string) {
    return this.queueService.enqueueNotification({
      userId,
      type: 'system',
      message,
    });
  }
}
