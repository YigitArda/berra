'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationsResponse, notificationsQueryKey } from '../lib/notifications';
import { getSocket, releaseSocket, SOCKET_EVENTS } from '../lib/socket';
import { useAppStore } from '../store/app-store';

type NotificationCreatedPayload = {
  message: string;
  notificationId?: number;
};

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const setToastMessage = useAppStore((s) => s.setToastMessage);

  useEffect(() => {
    const socket = getSocket();
    let toastTimer: ReturnType<typeof setTimeout> | null = null;

    const onNotificationCreated = (payload: NotificationCreatedPayload) => {
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
            {
              id: payload.notificationId ?? -Date.now(),
              type: 'SYSTEM',
              message: payload.message,
              link: null,
              is_read: false,
              created_at: new Date().toISOString(),
            },
            ...current.notifications,
          ],
        };
      });

      const nextUnread =
        queryClient.getQueryData<NotificationsResponse>(notificationsQueryKey)?.unread ??
        useAppStore.getState().localBadgeCount + 1;
      useAppStore.getState().setLocalBadgeCount(nextUnread);
      setToastMessage(payload.message);
      if (toastTimer) {
        clearTimeout(toastTimer);
      }
      toastTimer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    };

    socket.on(SOCKET_EVENTS.notificationCreated, onNotificationCreated);

    return () => {
      if (toastTimer) {
        clearTimeout(toastTimer);
      }
      socket.off(SOCKET_EVENTS.notificationCreated, onNotificationCreated);
      releaseSocket();
    };
  }, [queryClient, setToastMessage]);
}
