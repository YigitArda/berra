'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useRequireAuth } from '../../hooks/use-require-auth';
import { useMarkAllNotificationsRead, useNotifications, patchMarkAllRead } from '../../hooks/use-notifications';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function NotificationsPage() {
  const { isLoading: isSessionLoading } = useRequireAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();

  if (isSessionLoading) {
    return <p>Oturum doğrulanıyor...</p>;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">Bildirim Merkezi</h1>
        <p className="mt-2 text-slate-300">Okunmamış: {notificationsQuery.unreadCount}</p>
        <Button
          className="mt-3"
          onClick={() => {
            markAllReadMutation.mutate(undefined, {
              onSuccess: () => patchMarkAllRead(queryClient),
            });
          }}
          disabled={markAllReadMutation.isPending}
        >
          Tümünü okundu işaretle
        </Button>
      </Card>

      {notificationsQuery.isError && (
        <Card>
          <p className="text-red-300">{(notificationsQuery.error as Error).message}</p>
        </Card>
      )}

      {notificationsQuery.notifications.map((item) => (
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
