'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

import { useSession } from '../../../hooks/use-session';
import { apiFetch } from '../../../lib/api';

type ModelDetailResponse = {
  model: { id: number; brand: string; model: string; generation: string | null; slug: string; description: string | null };
  threads: Array<{ id: number; slug: string; title: string; reply_count: number; view_count: number }>;
  user_cars: Array<{ id: number; username: string; year: number; is_current: boolean }>;
  maintenance_logs: Array<{ id: number; type: string; done_date: string; done_km: number | null; username: string }>;
  galleries: Array<{ id: number; image_url: string; caption: string | null; username: string }>;
  score: { avg_score: string | null; total_votes: number };
  chronic_issues: Array<{ id: number; title: string; body: string | null; severity: number }>;
};

export default function ModelDetailPage({ params }: { params: { slug: string } }) {
  const { isAuthenticated } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const { slug } = params;

  const modelQuery = useQuery({
    queryKey: ['models', slug],
    // CUTOVER_PROXY: `/discovery/*` requests go through Nest API and are proxied during migration.
    queryFn: () => apiFetch<ModelDetailResponse>(`/discovery/models/${slug}`),
  });

  const followMutation = useMutation({
    mutationFn: () => {
      const modelId = modelQuery.data?.model.id;
      if (!modelId) return Promise.reject(new Error('Model henüz yüklenmedi'));
      // CUTOVER_PROXY: `/discovery/*` requests go through Nest API and are proxied during migration.
      return apiFetch(`/discovery/models/${modelId}/follow`, { method: isFollowing ? 'DELETE' : 'POST' });
    },
    onSuccess: () => setIsFollowing((prev) => !prev),
  });

  if (!modelQuery.data) {
    return <Card><p className="text-slate-900 dark:text-slate-100">Model bilgileri yükleniyor...</p></Card>;
  }

  const { model, threads, chronic_issues: issues, maintenance_logs: maintenanceLogs, user_cars: userCars, score } = modelQuery.data;

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{model.brand} {model.model}</h1>
            {model.generation && <p className="text-sm text-slate-500 dark:text-slate-400">{model.generation}</p>}
            {model.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{model.description}</p>}
          </div>
          <Button disabled={!isAuthenticated || followMutation.isPending} onClick={() => followMutation.mutate()}>
            {isFollowing ? 'Model takibini bırak' : 'Modeli takip et'}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
          <Badge variant="neutral">Ortalama skor: {score?.avg_score ?? 'N/A'}</Badge>
          <Badge variant="outline">Skor oyu: {score?.total_votes ?? 0}</Badge>
          <Badge variant="outline">Aktif thread: {threads.length}</Badge>
          <Badge variant="outline">Kullanıcı aracı: {userCars.length}</Badge>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Son açılan konular</h2>
          <div className="mt-3 grid gap-2">
            {threads.slice(0, 8).map((thread) => (
              <Link key={thread.id} href={`/thread/${thread.slug}`} className="rounded border border-slate-300 p-3 text-sm hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{thread.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">👁 {thread.view_count} · 💬 {thread.reply_count}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kronik sorun kartları</h2>
          <div className="mt-3 grid gap-2">
            {issues.slice(0, 8).map((issue) => (
              <div key={issue.id} className="rounded border border-slate-300 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{issue.title}</p>
                  <Badge variant={issue.severity >= 4 ? 'danger' : 'outline'}>Seviye {issue.severity}</Badge>
                </div>
                {issue.body && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{issue.body}</p>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bakım maliyeti içgörüleri</h2>
          <div className="mt-3 grid gap-2">
            {maintenanceLogs.slice(0, 8).map((row) => (
              <div key={row.id} className="rounded border border-slate-300 p-3 text-sm dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{row.type}</p>
                <p className="text-slate-600 dark:text-slate-400">{new Date(row.done_date).toLocaleDateString('tr-TR')} · {row.done_km ?? '-'} km · {row.username}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Model shortlist</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Karşılaştırma için modele göre shortlist oluşturma alanı (E92 vs F30 gibi) v1.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">BMW E92</Badge>
            <Badge variant="outline">BMW F30</Badge>
            <Badge variant="outline">Golf 7</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
