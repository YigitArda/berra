'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '../store/app-store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

export function useRealtimeNotifications() {
  const incrementUnread = useAppStore((s) => s.incrementUnread);
  const setToastMessage = useAppStore((s) => s.setToastMessage);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on('notification.created', (payload: { message: string }) => {
      incrementUnread();
      setToastMessage(payload.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [incrementUnread, setToastMessage]);
}
