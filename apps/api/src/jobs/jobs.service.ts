import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class JobsService {
  constructor(private readonly queueService: QueueService) {}

  async enqueueDemoEmail() {
    const job = await this.queueService.enqueueEmail({
      to: 'demo@example.com',
      subject: 'Job test',
      html: '<p>Job queue test</p>',
    });
    return { message: 'Demo email job queued', jobId: job.id };
  }

  async enqueueDemoMedia(contentId: number, userId: number) {
    const job = await this.queueService.enqueueMediaProcessing({
      contentId,
      userId,
      sourceUrl: `https://cdn.example.com/raw/${contentId}.jpg`,
    });
    return { message: 'Demo media job queued', jobId: job.id };
  }
}
