'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { NotificationsResponse, notificationsQueryKey } from '../lib/notifications';
import { useAppStore } from '../store/app-store';

type NotificationPayload = {
  message: string;
};

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const setToastMessage = useAppStore((s) => s.setToastMessage);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    let toastTimer: ReturnType<typeof setTimeout> | null = null;

    socket.on('notification.created', (payload: { message: string; notificationId?: number }) => {
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
      if (toastTimer) clearTimeout(toastTimer);
      socket.disconnect();
    };
  }, [queryClient, setToastMessage]);
}
