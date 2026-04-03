'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForum } from '../../hooks/use-forum';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

const categories = [
  { id: 'all', label: 'Tümü' },
  { id: 'genel', label: '💬 Genel' },
  { id: 'ilk-araba', label: '⭐ İlk Araba' },
  { id: 'modifiye', label: '🔧 Modifiye' },
  { id: 'ilan', label: '👁 İlan' },
  { id: 'ariza', label: '🛠 Arıza' },
] as const;

export function ForumClient() {
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const forumQuery = useForum(category, page);

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

      <div className="grid gap-3">
        {(forumQuery.data?.threads ?? []).map((thread) => (
          <Card key={thread.id}>
            <Link href={`/thread/${thread.slug}`} className="text-lg font-semibold hover:underline">{thread.title}</Link>
            <p className="mt-1 text-sm text-slate-400">{thread.author} · {new Date(thread.created_at).toLocaleString('tr-TR')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {thread.is_pinned && <Badge variant="neutral">Sabit</Badge>}
              {thread.is_locked && <Badge variant="outline">Kilitli</Badge>}
            </div>
            <p className="mt-2 text-xs text-slate-400">💬 {thread.reply_count} · 👁 {thread.view_count}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>Önceki</Button>
        <span className="text-sm text-slate-400">Sayfa {page}</span>
        <Button variant="ghost" onClick={() => setPage((prev) => prev + 1)}>Sonraki</Button>
      </div>
    </div>
  );
}
