import { requireServerSession } from '../../lib/auth/server';
import { NotificationsClient } from './notifications-client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect } from 'react';
import { useAppStore } from '../../store/app-store';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { apiFetch } from '../../lib/api';
import { toUserMessage } from '../../lib/error-message';
import { NotificationsResponse, notificationsQueryKey } from '../../lib/notifications';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const unread = useAppStore((s) => s.unreadCount);
  const setUnreadCount = useAppStore((s) => s.setUnreadCount);

  const notificationsQuery = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => apiFetch<NotificationsResponse>('/notifications?page=1&limit=20'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiFetch('/notifications/read-all', {
        method: 'PUT',
      }),
    onSuccess: () => {
      setUnreadCount(0);
      queryClient.setQueryData<NotificationsResponse>(notificationsQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          unread: 0,
          notifications: current.notifications.map((item) => ({ ...item, is_read: true })),
        };
      });
    },
  });

  useEffect(() => {
    if (typeof notificationsQuery.data?.unread === 'number') {
      setUnreadCount(notificationsQuery.data.unread);
    }
  }, [notificationsQuery.data?.unread, setUnreadCount]);

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">Bildirim Merkezi</h1>
        <p className="mt-2 text-slate-300">Okunmamış: {unread}</p>
        <Button
          className="mt-3"
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
        >
          Tümünü okundu işaretle
        </Button>
      </Card>

      {notificationsQuery.isError && (
        <Card>
          <p className="text-red-300">{toUserMessage(notificationsQuery.error)}</p>
        </Card>
      )}

      {(notificationsQuery.data?.notifications ?? []).map((item) => (
        <Card key={item.id}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p>{item.message}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('tr-TR')}</p>
            </div>
            {!item.is_read && <span className="rounded bg-emerald-700 px-2 py-1 text-xs">Yeni</span>}
          </div>
          {item.link && (
            <Link href={item.link} className="mt-3 inline-block text-sm text-blue-300 hover:underline">
              Bildirime git
            </Link>
          )}
        </Card>
      ))}
    </div>
  );
}
