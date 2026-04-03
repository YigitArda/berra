export type NotificationItem = {
  id: number;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  unread: number;
  page: number;
  limit: number;
};

export const notificationsQueryKey = ['notifications', 1] as const;
