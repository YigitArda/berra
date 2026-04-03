import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { useRealtimeNotifications } from '../use-realtime-notifications';
import { notificationsQueryKey } from '../../lib/notifications';
import { useAppStore } from '../../store/app-store';
import { getSocket, releaseSocket } from '../../lib/socket';

const onMock = vi.fn();
const offMock = vi.fn();

type NotificationHandler = (payload: { message: string; notificationId?: number }) => void;
let notificationHandler: NotificationHandler | undefined;

vi.mock('../../lib/socket', () => ({
  getSocket: vi.fn(() => ({
    on: onMock.mockImplementation((event: string, handler: NotificationHandler) => {
      if (event === 'notification.created') {
        notificationHandler = handler;
      }
    }),
    off: offMock,
  })),
  releaseSocket: vi.fn(),
}));

function HookHarness() {
  useRealtimeNotifications();
  return null;
}

describe('useRealtimeNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    notificationHandler = undefined;
    onMock.mockClear();
    offMock.mockClear();
    useAppStore.setState({ unreadCount: 0, toastMessage: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('updates unread state and query cache on notification event', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <HookHarness />
      </QueryClientProvider>,
    );

    expect(getSocket).toHaveBeenCalledTimes(1);
    expect(notificationHandler).toBeTypeOf('function');

    act(() => {
      notificationHandler?.({ message: 'Yeni bildirim', notificationId: 99 });
    });

    const cached = client.getQueryData<{ notifications: Array<{ id: number; message: string }>; unread: number }>(
      notificationsQueryKey,
    );

    expect(cached?.unread).toBe(1);
    expect(cached?.notifications[0]).toMatchObject({ id: 99, message: 'Yeni bildirim' });
    expect(useAppStore.getState().toastMessage).toBe('Yeni bildirim');
    expect(useAppStore.getState().unreadCount).toBe(1);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(useAppStore.getState().toastMessage).toBeNull();
    });
  });

  it('cleans up listener and releases socket on unmount', () => {
    const client = new QueryClient();

    const view = render(
      <QueryClientProvider client={client}>
        <HookHarness />
      </QueryClientProvider>,
    );

    view.unmount();

    expect(offMock).toHaveBeenCalledWith('notification.created', expect.any(Function));
    expect(releaseSocket).toHaveBeenCalledTimes(1);
  });
});
