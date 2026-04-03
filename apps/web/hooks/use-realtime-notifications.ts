'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationsResponse, notificationsQueryKey } from '../lib/notifications';
import { releaseSocket, SOCKET_EVENTS, subscribeSocketEvent } from '../lib/socket';
import { useAppStore } from '../store/app-store';

type NotificationCreatedPayload = {
  message: string;
  userId?: number;
  notificationId?: number;
};

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const setToastMessage = useAppStore((s) => s.setToastMessage);

  useEffect(() => {
    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeSocketEvent<NotificationCreatedPayload>(SOCKET_EVENTS.notificationCreated, (payload) => {
      queryClient.setQueryData<NotificationsResponse>(notificationsQueryKey, (current) => {
        if (!current) {
          return {
            notifications: [
              {
                id: payload.notificationId ?? -Date.now(),
                type: 'SYSTEM',
                message: payload.message,
                link: null,
                is_read: false,
                created_at: new Date().toISOString(),
              },
            ],
            unread: 1,
            page: 1,
            limit: 20,
          };
        }
        return {
          ...current,
          unread: current.unread + 1,
          notifications: [
            ...current.notifications,
            {
              id: payload.notificationId ?? -Date.now(),
              type: 'SYSTEM',
              message: payload.message,
              link: null,
              is_read: false,
              created_at: new Date().toISOString(),
            },
          ],
        };
      });

      const nextUnread = (queryClient.getQueryData<NotificationsResponse>(notificationsQueryKey)?.unread)
        ?? (useAppStore.getState().unreadCount + 1);
      useAppStore.getState().setUnreadCount(nextUnread);
      setToastMessage(payload.message);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    });

    return () => {
      unsubscribe();
      releaseSocket();
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, [queryClient, setToastMessage]);
}
