'use client';

import { useEffect } from 'react';
import { getSocket, releaseSocket } from '../lib/socket';
import { useAppStore } from '../store/app-store';

type NotificationPayload = {
  message: string;
};

export function useRealtimeNotifications() {
  const incrementUnread = useAppStore((s) => s.incrementUnread);
  const setToastMessage = useAppStore((s) => s.setToastMessage);

  useEffect(() => {
    const socket = getSocket();

    const handleNotificationCreated = (payload: NotificationPayload) => {
      incrementUnread();
      setToastMessage(payload.message);
    };

    socket.on('notification.created', handleNotificationCreated);

    return () => {
      socket.off('notification.created', handleNotificationCreated);
      releaseSocket();
    };
  }, [incrementUnread, setToastMessage]);
}
