export const QUEUE_NAMES = {
  notifications: 'notifications',
  email: 'email',
  mediaProcessing: 'media-processing',
  deadLetter: 'dead-letter',
} as const;

export const JOB_NAMES = {
  sendNotification: 'send-notification',
  sendEmail: 'send-email',
  processMedia: 'process-media',
  deadLetter: 'dead-letter',
} as const;
