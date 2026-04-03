'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { apiFetch } from '../../lib/api';

type ForumTag = { id: number; slug: string; usage_count: number };
type ForumThread = { id: number; slug: string; title: string; tags?: string[]; reply_count: number; view_count: number };

type ThreadsResponse = { threads: ForumThread[] };
type TagsResponse = { tags: ForumTag[] };

export default function ForumPage() {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tagsQuery = useQuery({
    queryKey: ['forum', 'tags'],
    queryFn: () => apiFetch<TagsResponse>('/forum/tags?limit=30'),
  });

  const threadsQuery = useQuery({
    queryKey: ['forum', 'threads', activeTag],
    queryFn: () => apiFetch<ThreadsResponse>(activeTag ? `/forum/threads?tag=${activeTag}&page=1` : '/forum/threads?page=1'),
  });

  const selectedTags = useMemo(() => (activeTag ? [activeTag] : []), [activeTag]);

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">Forum keşif</h1>
        <p className="mt-1 text-sm text-slate-300">Çoklu etiket keşfi, trend başlıklar ve hızlı geçiş.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant={activeTag === null ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveTag(null)}>
            Tümü
          </Button>
          {(tagsQuery.data?.tags ?? []).map((tag) => (
            <Button
              key={tag.id}
              variant={activeTag === tag.slug ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTag(tag.slug)}
            >
              #{tag.slug}
            </Button>
          ))}
        </div>
      </Card>

      {selectedTags.length > 0 && (
        <Card>
          <p className="text-sm text-slate-400">Seçili etiketler:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="outline">#{tag}</Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {(threadsQuery.data?.threads ?? []).map((thread) => (
          <Card key={thread.id}>
            <Link href={`/thread/${thread.slug}`} className="text-lg font-semibold hover:underline">
              {thread.title}
            </Link>
            <div className="mt-2 flex flex-wrap gap-2">
              {(thread.tags ?? []).map((tag) => (
                <button key={tag} type="button" onClick={() => setActiveTag(tag)}>
                  <Badge variant="outline">#{tag}</Badge>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">👁 {thread.view_count} · 💬 {thread.reply_count}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
