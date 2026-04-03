'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect } from 'react';
import { DataState } from '../../components/data-state';
import { InlineAlert } from '../../components/feedback/InlineAlert';
import { Skeleton } from '../../components/feedback/Skeleton';
import { resolveFeedbackErrorMessage } from '../../components/feedback/messages';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useRequireAuth } from '../../hooks/use-require-auth';
import { apiFetch } from '../../lib/api';
import { NotificationsResponse, notificationsQueryKey } from '../../lib/notifications';
import { useAppStore } from '../../store/app-store';

export function NotificationsClient() {
  const { isLoading: isSessionLoading } = useRequireAuth();
  const queryClient = useQueryClient();
  const unread = useAppStore((s) => s.localBadgeCount);
  const setUnreadCount = useAppStore((s) => s.setLocalBadgeCount);

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

  if (isSessionLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={2} />;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">Bildirim Merkezi</h1>
        <p className="mt-2 text-slate-300">Okunmamış: {unread}</p>
        <Button
          className="mt-3"
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || unread === 0}
        >
          {markAllReadMutation.isPending ? 'Güncelleniyor...' : 'Tümünü okundu işaretle'}
        </Button>
      </Card>

      {markAllReadMutation.isError && (
        <InlineAlert variant="error" message={resolveFeedbackErrorMessage(markAllReadMutation.error)} />
      )}

      <DataState
        isLoading={notificationsQuery.isLoading}
        isError={notificationsQuery.isError}
        isEmpty={notificationsQuery.isSuccess && notificationsQuery.data.notifications.length === 0}
        error={notificationsQuery.error}
        loadingTitle="Bildirimler yükleniyor..."
        emptyTitle="Bildiriminiz yok"
        emptyDescription="Yeni etkinlik olduğunda burada listelenecek."
        onRetry={() => notificationsQuery.refetch()}
        isRetrying={notificationsQuery.isRefetching}
      >
        <div className="grid gap-2">
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
      </DataState>
    </div>
  );
}
