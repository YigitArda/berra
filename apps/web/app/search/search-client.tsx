'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataState } from '../../components/data-state';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';

type SearchItem = {
  id: number;
  body: string;
  title?: string;
  username?: string;
  slug?: string;
  category_name?: string;
  reply_count?: number;
};

type SearchResponse = {
  items: SearchItem[];
  page?: number;
};

export function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [submitted, setSubmitted] = useState(searchParams.get('q') || '');
  const [type, setType] = useState<'threads' | 'users'>((searchParams.get('type') as 'threads' | 'users') || 'threads');
  const [page, setPage] = useState(Math.max(parseInt(searchParams.get('page') || '1', 10), 1));

  const enabled = useMemo(() => submitted.trim().length > 0, [submitted]);

  const searchQuery = useQuery({
    queryKey: ['search', submitted, type, page],
    queryFn: () => apiFetch<SearchResponse>(`/search?q=${encodeURIComponent(submitted)}&type=${type}&page=${page}`),
    enabled,
  });

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="mb-3 text-2xl font-bold">Arama</h1>
        <div className="mb-2 flex gap-2">
          <Button size="sm" variant={type === 'threads' ? 'primary' : 'ghost'} onClick={() => setType('threads')}>Konular</Button>
          <Button size="sm" variant={type === 'users' ? 'primary' : 'ghost'} onClick={() => setType('users')}>Kullanıcılar</Button>
        </div>
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Arama terimi..." />
          <Button onClick={() => {
            setSubmitted(q);
            setPage(1);
            router.replace(`/search?q=${encodeURIComponent(q)}&type=${type}&page=1`);
          }} disabled={searchQuery.isPending || q.trim().length === 0}>
            {searchQuery.isPending ? 'Aranıyor...' : 'Ara'}
          </Button>
        </div>
      </Card>

      {enabled ? (
        <DataState
          isLoading={searchQuery.isLoading}
          isError={searchQuery.isError}
          isEmpty={searchQuery.isSuccess && (searchQuery.data?.items.length ?? 0) === 0}
          error={searchQuery.error}
          loadingTitle="Sonuçlar getiriliyor..."
          emptyTitle="Sonuç bulunamadı"
          emptyDescription="Farklı bir arama terimi ile tekrar deneyin."
          onRetry={() => searchQuery.refetch()}
          isRetrying={searchQuery.isRefetching}
        >
          <div className="grid gap-2">
            {(searchQuery.data?.items ?? []).map((item) => (
              <Card key={item.id}>
                {type === 'threads' ? (
                  <>
                    <p className="font-semibold">{item.title || item.body}</p>
                    <p className="text-sm text-slate-400">{item.category_name || 'Kategori yok'} · 💬 {item.reply_count ?? 0}</p>
                    {item.username && <p className="text-sm text-slate-300">Yazar: {item.username}</p>}
                  </>
                ) : (
                  <>
                    <p className="font-semibold">{item.username || item.title || `#${item.id}`}</p>
                    <p className="text-sm text-slate-300">{item.body}</p>
                  </>
                )}
              </Card>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Button variant="ghost" disabled={page <= 1} onClick={() => {
              const next = Math.max(page - 1, 1);
              setPage(next);
              router.replace(`/search?q=${encodeURIComponent(submitted)}&type=${type}&page=${next}`);
            }}>Önceki</Button>
            <span className="text-sm text-slate-400">Sayfa {page}</span>
            <Button variant="ghost" onClick={() => {
              const next = page + 1;
              setPage(next);
              router.replace(`/search?q=${encodeURIComponent(submitted)}&type=${type}&page=${next}`);
            }}>Sonraki</Button>
          </div>
        </DataState>
      ) : null}
    </div>
  );
}
