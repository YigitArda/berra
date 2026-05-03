'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DataState } from '../../components/data-state';
import { Skeleton } from '../../components/feedback/Skeleton';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ForumThread, useForum, useForumThread } from '../../hooks/use-forum';
import { formatRelativeTime } from '../../lib/format-time';

const categories = [
  { id: 'all', label: 'Tümü' },
  { id: 'genel', label: 'Genel' },
  { id: 'haberler', label: 'Haberler' },
  { id: 'modifiye', label: 'Modifiye' },
  { id: 'alim-satim', label: 'Alım-Satım' },
  { id: 'teknik', label: 'Teknik' },
] as const;

const PAGE_SIZE = 20;

const demoThreads: ForumThread[] = [
  {
    id: -1,
    title: 'İkinci elde Civic mi Corolla mı?',
    slug: 'demo-civic-corolla',
    is_pinned: true,
    is_locked: false,
    view_count: 184,
    reply_count: 12,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    author: 'garajci',
  },
  {
    id: -2,
    title: '600 bin TL bütçeyle ilk araba önerileri',
    slug: 'demo-ilk-araba',
    is_pinned: false,
    is_locked: false,
    view_count: 96,
    reply_count: 8,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    author: 'arda',
  },
  {
    id: -3,
    title: 'Sanayide triger değişimi için fiyatlar nasıl?',
    slug: 'demo-triger',
    is_pinned: false,
    is_locked: false,
    view_count: 61,
    reply_count: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    author: 'usta-notlari',
  },
];

const demoPosts: Record<
  string,
  Array<{ id: number; username: string; body: string; created_at: string; like_count: number }>
> = {
  'demo-civic-corolla': [
    {
      id: -10,
      username: 'garajci',
      body: 'Bütçe benzerken Civic sürüş olarak daha keyifli, Corolla ise masraf tarafında daha sakin duruyor. Siz hangisini seçerdiniz?',
      created_at: demoThreads[0].created_at,
      like_count: 7,
    },
    {
      id: -11,
      username: 'mert',
      body: 'Şehir içi ve sorunsuzluk öncelikse Corolla. LPG geçmişi ve bakım kayıtları temizse Civic de mantıklı.',
      created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      like_count: 4,
    },
  ],
  'demo-ilk-araba': [
    {
      id: -20,
      username: 'arda',
      body: 'İlk araba için otomatik, parçası kolay bulunan ve temiz geçmişli modelleri öne alıyorum. Clio, i20, Egea, Corolla bakıyorum.',
      created_at: demoThreads[1].created_at,
      like_count: 5,
    },
  ],
  'demo-triger': [
    {
      id: -30,
      username: 'usta-notlari',
      body: 'Parça markası ve işçilik kalitesine göre fiyat çok değişiyor. Sadece fiyat değil, yapılan işi belgeleyen servis daha önemli.',
      created_at: demoThreads[2].created_at,
      like_count: 3,
    },
  ],
};

function ThreadListItem({
  thread,
  isActive,
  onSelect,
}: {
  thread: ForumThread;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full rounded-lg border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950',
        isActive
          ? 'border-primary/60 bg-blue-50 shadow-sm dark:bg-blue-950/30'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 min-w-0 text-sm font-semibold text-slate-950 dark:text-white">
          {thread.title}
        </p>
        {thread.is_pinned && <Badge variant="neutral">Sabit</Badge>}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {thread.author} · {formatRelativeTime(thread.created_at)}
      </p>
      <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        {thread.reply_count} yanıt · {thread.view_count} görüntülenme
      </p>
    </button>
  );
}

function ThreadDetailPanel({ slug }: { slug: string | null }) {
  const demoThread = demoThreads.find((thread) => thread.slug === slug);
  const threadQuery = useForumThread(demoThread ? null : slug, 1);

  if (!slug) {
    return (
      <Card className="min-h-[420px] content-center text-center">
        <p className="text-lg font-semibold text-slate-950 dark:text-white">Bir konu seç</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
          Sol taraftaki başlıklardan birine tıklayınca konu akışı burada açılır.
        </p>
      </Card>
    );
  }

  if (demoThread) {
    const posts = demoPosts[demoThread.slug] ?? [];

    return (
      <section className="grid gap-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
                {demoThread.title}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {formatRelativeTime(demoThread.created_at)} · {demoThread.reply_count} yanıt ·{' '}
                {demoThread.view_count} görüntülenme
              </p>
            </div>
            <Badge variant="neutral">Örnek akış</Badge>
          </div>
        </Card>
        <div className="grid gap-3">
          {posts.map((post, index) => (
            <Card key={post.id}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                  {post.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950 dark:text-white">{post.username}</p>
                    {index === 0 && <Badge variant="outline">Konu</Badge>}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatRelativeTime(post.created_at)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {post.body}
                  </p>
                  <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {post.like_count} beğeni
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (threadQuery.isLoading) {
    return <Skeleton title="Konu yükleniyor..." lines={6} />;
  }

  if (threadQuery.isError || !threadQuery.data) {
    return (
      <Card>
        <p className="text-sm text-red-600 dark:text-red-300">Konu açılırken hata oluştu.</p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => threadQuery.refetch()}
          disabled={threadQuery.isRefetching}
        >
          Yenile
        </Button>
      </Card>
    );
  }

  const { thread, posts } = threadQuery.data;

  return (
    <section className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{thread.title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {formatRelativeTime(thread.created_at)} · {thread.reply_count} yanıt ·{' '}
              {thread.view_count} görüntülenme
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {thread.is_locked && <Badge variant="outline">Kilitli</Badge>}
            <Badge variant="neutral">{thread.followers} takip</Badge>
          </div>
        </div>
        {thread.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-3">
        {posts.map((post, index) => (
          <Card key={post.id} className={post.is_deleted ? 'opacity-60' : undefined}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                {post.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950 dark:text-white">{post.username}</p>
                  {index === 0 && <Badge variant="outline">Konu</Badge>}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeTime(post.created_at)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {post.is_deleted ? 'Bu içerik silinmiş.' : post.body}
                </p>
                <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {post.like_count} beğeni
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function ForumClient() {
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const forumQuery = useForum(category, page);

  const isUsingDemoThreads = forumQuery.isError;
  const threads = useMemo(
    () => (isUsingDemoThreads ? demoThreads : (forumQuery.data?.threads ?? [])),
    [forumQuery.data?.threads, isUsingDemoThreads],
  );
  const hasMore = threads.length >= PAGE_SIZE;

  useEffect(() => {
    if (!threads.length) {
      setSelectedSlug(null);
      return;
    }

    if (!selectedSlug || !threads.some((thread) => thread.slug === selectedSlug)) {
      setSelectedSlug(threads[0].slug);
    }
  }, [selectedSlug, threads]);

  return (
    <div className="grid gap-4">
      <Card className="mx-4 lg:mx-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Forum</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              Konu başlıkları ve akış
            </h1>
          </div>
          <Link href="/forum/new">
            <Button>Yeni Konu</Button>
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={category === item.id ? 'primary' : 'ghost'}
              onClick={() => {
                setCategory(item.id);
                setPage(1);
                setSelectedSlug(null);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-0">
        <aside className="border-slate-200 bg-slate-50 px-3 lg:sticky lg:top-[73px] lg:max-h-[calc(100vh-73px)] lg:overflow-y-auto lg:border-r lg:py-3 dark:border-slate-800 dark:bg-slate-950">
          <DataState
            isLoading={forumQuery.isLoading}
            isError={forumQuery.isError && !isUsingDemoThreads}
            isEmpty={forumQuery.isSuccess && threads.length === 0}
            error={forumQuery.error}
            loadingTitle="Konular yükleniyor..."
            skeletonLines={8}
            emptyTitle="Henüz konu yok"
            emptyDescription="Bu kategoride henüz konu açılmamış."
            onRetry={() => forumQuery.refetch()}
            isRetrying={forumQuery.isRefetching}
          >
            <div className="grid gap-2">
              {threads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.slug === selectedSlug}
                  onSelect={() => setSelectedSlug(thread.slug)}
                />
              ))}
            </div>
          </DataState>

          <div className="mt-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Önceki
            </Button>
            <span className="text-xs font-medium text-slate-400">Sayfa {page}</span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasMore || forumQuery.isFetching}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Sonraki
            </Button>
          </div>
        </aside>

        <main className="min-w-0 px-4 pb-6 lg:px-6">
          <ThreadDetailPanel slug={selectedSlug} />
        </main>
      </div>
    </div>
  );
}
