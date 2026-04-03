'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { useSession } from '../hooks/use-session';
import { apiFetch, getHealthEndpoint } from '../lib/api';
import { readRecentThreads } from '../lib/recent-threads';

type ThreadListResponse = {
  threads: Array<{ id: number; slug: string; title: string; tags?: string[] }>;
};

type FeedResponse = {
  posts: Array<{ id: number; body: string; username: string }>;
};

type TagResponse = {
  tags: Array<{ id: number; slug: string; usage_count: number }>;
};

type ModelsResponse = {
  models: Array<{ id: number; slug: string; brand: string; model: string }>;
};

export default function HomePage() {
  const { isAuthenticated } = useSession();
  const [apiHealth, setApiHealth] = useState('Kontrol ediliyor...');
  const [recentThreads, setRecentThreads] = useState(readRecentThreads());

  useEffect(() => {
    const healthEndpoint = getHealthEndpoint();
    if (!healthEndpoint) {
      setApiHealth('API adresi tanımlı değil.');
      return;
    }

    let cancelled = false;
    fetch(healthEndpoint, { cache: 'no-store' })
      .then((res) => {
        if (cancelled) return;
        setApiHealth(res.ok ? 'API erişilebilir' : 'API yanıtı başarısız');
      })
      .catch(() => {
        if (cancelled) return;
        setApiHealth('API erişimi yok (api servisi çalışmıyor olabilir).');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setRecentThreads(readRecentThreads());
  }, []);

  const followingFeedQuery = useQuery({
    queryKey: ['home', 'following-feed'],
    queryFn: () => apiFetch<FeedResponse>('/feed?page=1'),
    enabled: isAuthenticated,
  });

  const trendingThreadsQuery = useQuery({
    queryKey: ['home', 'trending-threads'],
    queryFn: () => apiFetch<ThreadListResponse>('/forum/threads?page=1'),
  });

  const trendingTagsQuery = useQuery({
    queryKey: ['home', 'trending-tags'],
    queryFn: () => apiFetch<TagResponse>('/forum/tags?limit=8'),
  });

  const modelsQuery = useQuery({
    queryKey: ['home', 'models'],
    queryFn: () => apiFetch<ModelsResponse>('/discovery/models?limit=6'),
  });

  const quickActions = useMemo(
    () => [
      { href: '/feed', label: 'Gönderi paylaş' },
      { href: '/forum', label: 'Konu aç / keşfet' },
      { href: '/models', label: 'Modeli takip et' },
      { href: '/notifications', label: 'Bildirimleri yönet' },
    ],
    [],
  );

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-3xl font-bold">Senin için ana sayfa</h1>
        <p className="mt-2 text-slate-300">
          Takip ettiklerin, trend içerikler ve hızlı aksiyonlar tek ekranda.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          <strong>Durum:</strong> {apiHealth}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Senin için akış</h2>
          <p className="mb-3 mt-1 text-sm text-slate-400">Takip akışı (kişiselleştirme v1).</p>
          <div className="grid gap-2">
            {(followingFeedQuery.data?.posts ?? []).slice(0, 4).map((post) => (
              <div key={post.id} className="rounded border border-slate-700 p-3">
                <p className="text-sm font-semibold">{post.username}</p>
                <p className="text-sm text-slate-300">{post.body}</p>
              </div>
            ))}
            {!followingFeedQuery.isLoading && (followingFeedQuery.data?.posts.length ?? 0) === 0 && (
              <p className="text-sm text-slate-400">Henüz kişisel akış verisi yok. Takip etmeye başlayın.</p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Bugün trend</h2>
          <p className="mb-3 mt-1 text-sm text-slate-400">Tag + thread + model keşfi.</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {(trendingTagsQuery.data?.tags ?? []).map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.slug}`}>
                <Badge variant="outline">#{tag.slug}</Badge>
              </Link>
            ))}
          </div>
          <div className="grid gap-2">
            {(trendingThreadsQuery.data?.threads ?? []).slice(0, 3).map((thread) => (
              <Link key={thread.id} href={`/thread/${thread.slug}`} className="rounded border border-slate-700 p-3 text-sm hover:border-slate-500">
                {thread.title}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Devam et</h2>
          <p className="mb-3 mt-1 text-sm text-slate-400">En son baktığın thread’ler.</p>
          <div className="grid gap-2">
            {recentThreads.map((thread) => (
              <Link key={thread.slug} href={`/thread/${thread.slug}`} className="rounded border border-slate-700 p-3 text-sm hover:border-slate-500">
                <p className="font-semibold">{thread.title}</p>
                <p className="text-xs text-slate-400">{new Date(thread.viewedAt).toLocaleString('tr-TR')}</p>
              </Link>
            ))}
            {recentThreads.length === 0 && <p className="text-sm text-slate-400">Henüz ziyaret edilen thread yok.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Hızlı aksiyonlar</h2>
          <p className="mb-3 mt-1 text-sm text-slate-400">Tek dokunuşla temel işlemler.</p>
          <div className="grid gap-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="rounded border border-slate-700 p-3 text-sm font-semibold hover:border-slate-500">
                {action.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-700 pt-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Öne çıkan modeller</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(modelsQuery.data?.models ?? []).map((item) => (
                <Link key={item.id} href={`/models/${item.slug}`}>
                  <Badge variant="neutral">{item.brand} {item.model}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
