'use client';

import { io, Socket } from 'socket.io-client';
import { REALTIME_EVENT, type RealtimeEventName } from '@berra/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';
const IS_DEV = process.env.NODE_ENV !== 'production';

let socketInstance: Socket | null = null;
let consumerCount = 0;
let latestReconnectAttempt = 0;

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

function telemetry(event: string, payload: Record<string, unknown>) {
  if (IS_DEV) {
    logDebug(`telemetry:${event}`, payload);
  }
}

function getReconnectBackoffMs(attempt: number) {
  const baseDelay = 1_000;
  const maxDelay = 10_000;
  return Math.min(baseDelay * 2 ** Math.max(attempt - 1, 0), maxDelay);
}

function attachLifecycleListeners(socket: Socket) {
  socket.on('connect', () => {
    latestReconnectAttempt = 0;
    logDebug('connected', { id: socket.id });
    telemetry('connected', { id: socket.id, transport: socket.io.engine.transport.name });
  });

  socket.io.on('reconnect_attempt', (attempt: number) => {
    latestReconnectAttempt = attempt;
    const backoffMs = getReconnectBackoffMs(attempt);
    telemetry('reconnect_attempt', { attempt, backoffMs });
  });

  socket.io.on('reconnect', (attempt: number) => {
    telemetry('reconnect_success', { attempt });
  });

  socket.io.on('reconnect_error', (error: Error) => {
    telemetry('reconnect_error', {
      attempt: latestReconnectAttempt,
      message: error.message,
      name: error.name,
    });
    logError('reconnect error', error);
  });

  socket.on('connect_error', (error: Error & { description?: unknown; context?: unknown }) => {
    telemetry('connect_error', {
      message: error.message,
      name: error.name,
      description: error.description,
      context: error.context,
    });
    logError('connect error', error);
  });
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
    attachLifecycleListeners(socketInstance);
  }

  consumerCount += 1;

  return socketInstance;
}

export function subscribeSocketEvent<TPayload>(
  event: RealtimeEventName,
  handler: (payload: TPayload) => void
) {
  const socket = getSocket();
  socket.off(event, handler as (...args: unknown[]) => void);
  socket.on(event, handler as (...args: unknown[]) => void);

  return () => {
    socket.off(event, handler as (...args: unknown[]) => void);
  };
}

export const SOCKET_EVENTS = REALTIME_EVENT;

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
