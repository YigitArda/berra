import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { JOB_NAMES, QUEUE_NAMES } from './queue.constants';

const config = new ConfigService();
const connection = new IORedis(config.get<string>('REDIS_URL', 'redis://127.0.0.1:6379'), {
  maxRetriesPerRequest: null,
});

new Worker(
  QUEUE_NAMES.notifications,
  async (job) => {
    if (job.name === JOB_NAMES.sendNotification) {
      // TODO: Burayı DB insert + websocket publish ile doldur.
      console.log('[worker][notification]', job.data);
    }
  },
  { connection },
);

new Worker(
  QUEUE_NAMES.email,
  async (job) => {
    if (job.name === JOB_NAMES.sendEmail) {
      // TODO: Burayı gerçek e-posta sağlayıcısına (SES/Resend/Postmark) bağla.
      console.log('[worker][email]', job.data);
    }
  },
  { connection },
);

console.log('Queue workers started.');
