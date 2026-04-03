'use client';

import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { CACHE_PATCH_STRATEGY } from '../lib/query-patch-strategy';
import { NotificationItem, NotificationsResponse, notificationsQueryKey } from '../lib/notifications';

export type NotificationCreatedPayload = {
  message: string;
  notificationId?: number;
};

export function patchNotificationCreated(
  queryClient: QueryClient,
  payload: NotificationCreatedPayload,
) {
  if (CACHE_PATCH_STRATEGY.NOTIFICATION_CREATED_EVENT !== 'setQueryData') {
    void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    return;
  }

  queryClient.setQueryData<NotificationsResponse>(notificationsQueryKey, (current) => {
    const nextItem: NotificationItem = {
      id: payload.notificationId ?? -Date.now(),
      type: 'SYSTEM',
      message: payload.message,
      link: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (!current) {
      return {
        notifications: [nextItem],
        unread: 1,
        page: 1,
        limit: 20,
      };
    }

    return {
      ...current,
      unread: current.unread + 1,
      notifications: [nextItem, ...current.notifications],
    };
  });
}

export function patchMarkAllRead(queryClient: QueryClient) {
  if (CACHE_PATCH_STRATEGY.NOTIFICATIONS_MARK_ALL_READ !== 'setQueryData') {
    void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    return;
  }

  queryClient.setQueryData<NotificationsResponse>(notificationsQueryKey, (current) => {
    if (!current) return current;

    return {
      ...current,
      unread: 0,
      notifications: current.notifications.map((item) => ({ ...item, is_read: true })),
    };
  });
}

export function useNotifications() {
  const notificationsQuery = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => apiFetch<NotificationsResponse>('/notifications?page=1&limit=20'),
  });

  return {
    ...notificationsQuery,
    unreadCount: notificationsQuery.data?.unread ?? 0,
    notifications: notificationsQuery.data?.notifications ?? [],
  };
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: () =>
      apiFetch('/notifications/read-all', {
        method: 'PUT',
      }),
  });
}
