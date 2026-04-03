'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/card';
import { apiFetch } from '../../../lib/api';

type ThreadsResponse = {
  threads: Array<{ id: number; slug: string; title: string; reply_count: number; view_count: number }>;
};

export default function TagLandingPage({ params }: { params: { slug: string } }) {
  const threadsQuery = useQuery({
    queryKey: ['tag', params.slug],
    queryFn: () => apiFetch<ThreadsResponse>(`/forum/threads?tag=${params.slug}&page=1`),
  });

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">#{params.slug}</h1>
        <p className="mt-1 text-sm text-slate-300">Tag landing sayfası (SEO + keşif).</p>
      </Card>

      <div className="grid gap-3">
        {(threadsQuery.data?.threads ?? []).map((thread) => (
          <Card key={thread.id}>
            <Link href={`/thread/${thread.slug}`} className="text-lg font-semibold hover:underline">
              {thread.title}
            </Link>
            <p className="mt-2 text-xs text-slate-400">👁 {thread.view_count} · 💬 {thread.reply_count}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
