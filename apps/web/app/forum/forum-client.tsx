'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForum } from '../../hooks/use-forum';
import { DataState } from '../../components/data-state';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { formatRelativeTime } from '../../lib/format-time';

const categories = [
  { id: 'all', label: 'Tümü' },
  { id: 'genel', label: '💬 Genel' },
  { id: 'haberler', label: '📰 Haberler' },
  { id: 'modifiye', label: '🔧 Modifiye' },
  { id: 'alim-satim', label: '👁 Alım-Satım' },
  { id: 'teknik', label: '🛠 Teknik' },
] as const;

const PAGE_SIZE = 20;

export function ForumClient() {
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const forumQuery = useForum(category, page);

  const hasMore = (forumQuery.data?.threads.length ?? 0) >= PAGE_SIZE;

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Forum</h1>
          <Link href="/forum/new">
            <Button>Yeni Konu</Button>
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((item) => (
            <Button key={item.id} size="sm" variant={category === item.id ? 'primary' : 'ghost'} onClick={() => { setCategory(item.id); setPage(1); }}>
              {item.label}
            </Button>
          ))}
        </div>
      </Card>

      <DataState
        isLoading={forumQuery.isLoading}
        isError={forumQuery.isError}
        isEmpty={forumQuery.isSuccess && (forumQuery.data?.threads.length ?? 0) === 0}
        error={forumQuery.error}
        loadingTitle="Konular yükleniyor..."
        skeletonLines={5}
        emptyTitle="Henüz konu yok"
        emptyDescription="Bu kategoride henüz konu açılmamış."
        onRetry={() => forumQuery.refetch()}
        isRetrying={forumQuery.isRefetching}
      >
        <div className="grid gap-3">
          {(forumQuery.data?.threads ?? []).map((thread) => (
            <Card key={thread.id}>
              <Link href={`/thread/${thread.slug}`} className="text-lg font-semibold hover:underline">{thread.title}</Link>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{thread.author} · {formatRelativeTime(thread.created_at)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {thread.is_pinned && <Badge variant="neutral">Sabit</Badge>}
                {thread.is_locked && <Badge variant="outline">Kilitli</Badge>}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">💬 {thread.reply_count} · 👁 {thread.view_count}</p>
            </Card>
          ))}
        </div>
      </DataState>

      <div className="flex items-center justify-between">
        <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>Önceki</Button>
        <span className="text-sm text-slate-400">Sayfa {page}</span>
        <Button variant="ghost" disabled={!hasMore || forumQuery.isFetching} onClick={() => setPage((prev) => prev + 1)}>Sonraki</Button>
      </div>
    </div>
  );
}
