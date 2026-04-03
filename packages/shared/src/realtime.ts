export const REALTIME_EVENT = {
  notificationCreated: 'notification.created',
  contentUpdated: 'content.updated',
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENT)[keyof typeof REALTIME_EVENT];
