'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { DataState } from '../../components/data-state';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { apiFetch } from '../../lib/api';

type FeedResponse = {
  posts: Array<{
    id: number;
    body: string;
    username: string;
    comment_count: number;
    like_count: number;
  }>;
};

type ThreadResponse = {
  threads: Array<{ id: number; title: string; slug: string; reply_count: number; tags?: string[] }>;
};

export default function FollowingPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'threads'>('feed');

  const feedQuery = useQuery({
    queryKey: ['following', 'feed'],
    queryFn: () => apiFetch<FeedResponse>('/feed?page=1'),
  });

  const threadsQuery = useQuery({
    queryKey: ['following', 'threads'],
    queryFn: () => apiFetch<ThreadResponse>('/forum/threads?page=1'),
  });

  const activeQuery = activeTab === 'feed' ? feedQuery : threadsQuery;
  const isEmpty =
    activeTab === 'feed'
      ? feedQuery.isSuccess && (feedQuery.data?.posts.length ?? 0) === 0
      : threadsQuery.isSuccess && (threadsQuery.data?.threads.length ?? 0) === 0;

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Takip akışı</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Takip ettiklerinden gelen içerikler ve tartışmalar.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeTab === 'feed' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('feed')}
          >
            Gönderiler
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'threads' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('threads')}
          >
            Konular
          </Button>
        </div>
      </Card>

      <DataState
        isLoading={activeQuery.isLoading}
        isError={activeQuery.isError}
        isEmpty={isEmpty}
        error={activeQuery.error}
        loadingTitle="Takip akışı yükleniyor..."
        emptyTitle="Henüz içerik yok"
        emptyDescription="Takip ettiğiniz kişilerden içerik geldiğinde burada görünür."
        onRetry={() => activeQuery.refetch()}
        isRetrying={activeQuery.isRefetching}
      >
        {activeTab === 'feed' && (
          <div className="grid gap-3">
            {(feedQuery.data?.posts ?? []).map((post) => (
              <Card key={post.id}>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {post.username}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                  {post.body}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {post.like_count} beğeni · {post.comment_count} yorum
                </p>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'threads' && (
          <div className="grid gap-3">
            {(threadsQuery.data?.threads ?? []).map((thread) => (
              <Card key={thread.id}>
                <Link
                  href={`/thread/${thread.slug}`}
                  className="text-base font-semibold text-slate-900 hover:underline dark:text-slate-100"
                >
                  {thread.title}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(thread.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {thread.reply_count} yanıt
                </p>
              </Card>
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}
