'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';
const IS_DEV = process.env.NODE_ENV !== 'production';

let socketInstance: Socket | null = null;
let consumerCount = 0;

function logDebug(message: string, ...rest: unknown[]) {
  if (!IS_DEV) {
    return;
  }

  // eslint-disable-next-line no-console
  console.info(`[socket] ${message}`, ...rest);
}

function logError(message: string, ...rest: unknown[]) {
  if (!IS_DEV) {
    return;
  }

  // eslint-disable-next-line no-console
  console.error(`[socket] ${message}`, ...rest);
}

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      randomizationFactor: 0.5
    });

    socketInstance.on('connect', () => {
      logDebug('connected', { id: socketInstance?.id });
    });

    socketInstance.on('reconnect_attempt', (attempt: number) => {
      logDebug(`reconnect attempt #${attempt}`);
    });

    socketInstance.on('reconnect', (attempt: number) => {
      logDebug(`reconnected on attempt #${attempt}`);
    });

    socketInstance.on('reconnect_error', (error: Error) => {
      logError('reconnect error', error);
    });

    socketInstance.on('connect_error', (error: Error) => {
      logError('connect error', error);
    });
  }

  consumerCount += 1;

  return socketInstance;
}

export function releaseSocket() {
  if (!socketInstance) {
    return;
  }

  consumerCount = Math.max(consumerCount - 1, 0);

  if (consumerCount === 0) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
