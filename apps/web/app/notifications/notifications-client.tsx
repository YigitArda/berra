'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DataState } from '../../components/data-state';
import { InlineAlert } from '../../components/feedback/InlineAlert';
import { Skeleton } from '../../components/feedback/Skeleton';
import { resolveFeedbackErrorMessage } from '../../components/feedback/messages';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useRequireAuth } from '../../hooks/use-require-auth';
import { apiFetch } from '../../lib/api';
import { NotificationsResponse, notificationsQueryKey } from '../../lib/notifications';
import { useAppStore } from '../../store/app-store';
import { formatRelativeTime } from '../../lib/format-time';

type NotificationTab = 'all' | 'follow' | 'reply' | 'like' | 'model';

const tabLabels: Record<NotificationTab, string> = {
  all: 'Tümü',
  follow: 'Takip',
  reply: 'Yanıt',
  like: 'Beğeni',
  model: 'Model',
};

function mapTypeToTab(type: string): NotificationTab {
  const normalized = type.toLowerCase();
  if (normalized.includes('follow')) return 'follow';
  if (normalized.includes('reply') || normalized.includes('thread_update')) return 'reply';
  if (normalized.includes('like')) return 'like';
  if (normalized.includes('model')) return 'model';
  return 'all';
}

export function NotificationsClient() {
  const { isLoading: isSessionLoading } = useRequireAuth();
  const queryClient = useQueryClient();
  const unread = useAppStore((s) => s.localBadgeCount);
  const setUnreadCount = useAppStore((s) => s.setLocalBadgeCount);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [mutedLinks, setMutedLinks] = useState<string[]>([]);

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

  const filteredNotifications = useMemo(() => {
    const items = notificationsQuery.data?.notifications ?? [];
    return items.filter((item) => {
      if (item.link && mutedLinks.includes(item.link)) return false;
      if (activeTab === 'all') return true;
      return mapTypeToTab(item.type) === activeTab;
    });
  }, [notificationsQuery.data?.notifications, activeTab, mutedLinks]);

  if (isSessionLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={2} />;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">Bildirim Merkezi v2</h1>
        <p className="mt-2 text-slate-300">Okunmamış: {unread}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'follow', 'reply', 'like', 'model'] as NotificationTab[]).map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={activeTab === tab ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabels[tab]}
            </Button>
          ))}
        </div>
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
        isEmpty={notificationsQuery.isSuccess && filteredNotifications.length === 0}
        error={notificationsQuery.error}
        loadingTitle="Bildirimler yükleniyor..."
        emptyTitle="Bildiriminiz yok"
        emptyDescription="Yeni etkinlik olduğunda burada listelenecek."
        onRetry={() => notificationsQuery.refetch()}
        isRetrying={notificationsQuery.isRefetching}
      >
        <div className="grid gap-2">
          {filteredNotifications.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" size="sm">{item.type}</Badge>
                    {!item.is_read && <Badge variant="success" size="sm">Yeni</Badge>}
                  </div>
                  <p>{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(item.created_at)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.link && (
                  <Link href={item.link} className="inline-block text-sm text-blue-300 hover:underline">
                    Bildirime git
                  </Link>
                )}
                {item.link && (
                  <button
                    type="button"
                    className="text-sm text-slate-300 underline"
                    onClick={() => setMutedLinks((prev) => [...new Set([...prev, item.link!])])}
                  >
                    Bu konudan bildirim kapat
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}
