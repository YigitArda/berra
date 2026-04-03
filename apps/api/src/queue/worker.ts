import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Pool } from 'pg';
import { REALTIME_EVENT } from '../../../../packages/shared/src';
import { JOB_NAMES, QUEUE_NAMES } from './queue.constants';

const config = new ConfigService();
const connection = new IORedis(config.get<string>('REDIS_URL', 'redis://127.0.0.1:6379'), {
  maxRetriesPerRequest: null,
});
const realtimePublisher = connection.duplicate();
const deadLetterQueue = new Queue(QUEUE_NAMES.deadLetter, { connection });
const db = new Pool({
  connectionString: config.get<string>('DATABASE_URL'),
  ssl: config.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
});

type RealtimeEnvelope =
  | { event: typeof REALTIME_EVENT.notificationCreated; payload: { userId: number; notificationId: number; message: string } }
  | { event: typeof REALTIME_EVENT.contentUpdated; payload: { contentId: number; action: 'updated'; entityRoom?: string } };

async function publishRealtime(envelope: RealtimeEnvelope) {
  await realtimePublisher.publish('realtime.events', JSON.stringify(envelope));
}

function bindDeadLetter(worker: Worker, queueName: string) {
  worker.on('failed', async (job, err) => {
    await deadLetterQueue.add(JOB_NAMES.deadLetter, {
      queue: queueName,
      jobName: job?.name ?? 'unknown',
      reason: err.message,
      data: job?.data ?? null,
      failedAt: new Date().toISOString(),
    });
  });
}

const notificationsWorker = new Worker(
  QUEUE_NAMES.notifications,
  async (job) => {
    if (job.name === JOB_NAMES.sendNotification) {
      const payload = job.data as {
        userId: number;
        type: 'reply' | 'like' | 'system';
        message: string;
        link?: string;
      };
      const { rows } = await db.query<{ id: number }>(
        `INSERT INTO notifications (user_id, type, message, link)
         VALUES ($1, UPPER($2), $3, $4)
         RETURNING id`,
        [payload.userId, payload.type, payload.message, payload.link ?? null],
      );
      const notificationId = rows[0]?.id;
      if (notificationId) {
        await publishRealtime({
          event: REALTIME_EVENT.notificationCreated,
          payload: { userId: payload.userId, notificationId, message: payload.message },
        });
      }
    }
  },
  { connection },
);
bindDeadLetter(notificationsWorker, QUEUE_NAMES.notifications);

const emailWorker = new Worker(
  QUEUE_NAMES.email,
  async (job) => {
    if (job.name === JOB_NAMES.sendEmail) {
      console.log('[worker][email]', job.data);
    }
  },
  { connection },
);
bindDeadLetter(emailWorker, QUEUE_NAMES.email);

const mediaProcessingWorker = new Worker(
  QUEUE_NAMES.mediaProcessing,
  async (job) => {
    if (job.name === JOB_NAMES.processMedia) {
      const payload = job.data as { contentId: number; userId: number; sourceUrl: string };
      await db.query(
        `UPDATE feed_posts
         SET body = CONCAT(body, ' [media-processed]')
         WHERE id = $1`,
        [payload.contentId],
      );
      await publishRealtime({
        event: REALTIME_EVENT.contentUpdated,
        payload: { contentId: payload.contentId, action: 'updated', entityRoom: `content:${payload.contentId}` },
      });
    }
  },
  { connection },
);
bindDeadLetter(mediaProcessingWorker, QUEUE_NAMES.mediaProcessing);

console.log('Queue workers started.');
