'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, releaseSocket } from '../lib/socket';
import { patchNotificationCreated } from './use-notifications';
import { useAppStore } from '../store/app-store';

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const setToastMessage = useAppStore((s) => s.setToastMessage);

  useEffect(() => {
    const socket = getSocket();
    let toastTimer: ReturnType<typeof setTimeout> | null = null;

    socket.on('notification.created', (payload: { message: string; notificationId?: number }) => {
      patchNotificationCreated(queryClient, payload);

      setToastMessage(payload.message);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    });

    return () => {
      if (toastTimer) clearTimeout(toastTimer);
      socket.off('notification.created');
      releaseSocket();
    };
  }, [queryClient, setToastMessage]);
}
