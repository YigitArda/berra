import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { JOB_NAMES, QUEUE_NAMES } from './queue.constants';

type NotificationPayload = {
  userId: number;
  type: 'reply' | 'like' | 'system';
  message: string;
  link?: string;
};

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly notificationsQueue: Queue;
  private readonly emailQueue: Queue;

  constructor(private readonly configService: ConfigService) {
    this.connection = new IORedis(this.configService.get<string>('REDIS_URL', 'redis://127.0.0.1:6379'), {
      maxRetriesPerRequest: null,
    });

    const defaultJobOptions: JobsOptions = {
      removeOnComplete: 200,
      removeOnFail: 500,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    };

    this.notificationsQueue = new Queue(QUEUE_NAMES.notifications, {
      connection: this.connection,
      defaultJobOptions,
    });

    this.emailQueue = new Queue(QUEUE_NAMES.email, {
      connection: this.connection,
      defaultJobOptions,
    });
  }

  enqueueNotification(payload: NotificationPayload) {
    return this.notificationsQueue.add(JOB_NAMES.sendNotification, payload);
  }

  enqueueEmail(payload: EmailPayload) {
    return this.emailQueue.add(JOB_NAMES.sendEmail, payload);
  }

  async onModuleDestroy() {
    await Promise.all([
      this.notificationsQueue.close(),
      this.emailQueue.close(),
      this.connection.quit(),
    ]);
  }
}
