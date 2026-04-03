'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DataState } from '../../components/data-state';
import { EmptyState } from '../../components/empty-state';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';
import type { SearchResponse } from '@berra/shared';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const enabled = useMemo(() => submitted.trim().length > 1, [submitted]);

  const searchQuery = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => apiFetch<SearchResponse>(`/search?q=${encodeURIComponent(submitted)}&page=1`),
    enabled,
  });

  const items = searchQuery.data?.items ?? [];

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="mb-3 text-2xl font-bold">Arama</h1>
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Arama terimi..." />
          <Button onClick={() => setSubmitted(q)}>Ara</Button>
        </div>
      </Card>

      {!enabled ? (
        <EmptyState
          title="Aramaya başlayın"
          description="Sonuçları görmek için en az 2 karakterlik bir terim girin."
        />
      ) : (
        <DataState
          isLoading={searchQuery.isLoading}
          isError={searchQuery.isError}
          isEmpty={items.length === 0}
          errorMessage={`Arama sonuçları alınamadı. Lütfen tekrar deneyin. ${searchQuery.error instanceof Error ? `(${searchQuery.error.message})` : ''}`}
          emptyTitle="Sonuç bulunamadı"
          emptyDescription="Farklı bir anahtar kelime ile tekrar arama yapabilirsiniz."
          onRetry={() => {
            void searchQuery.refetch();
          }}
        >
          <div className="grid gap-2">
            {items.map((item) => (
              <Card key={item.id}>
                <p className="font-semibold">#{item.id}</p>
                <p>{item.body}</p>
              </Card>
            ))}
          </div>
        </DataState>
      )}
    </div>
  );
}
