'use client';

import React from 'react';

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

  const results = searchQuery.data?.results ?? [];

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="mb-3 text-2xl font-bold">Arama</h1>
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Arama terimi..." />
          <Button onClick={() => setSubmitted(q)}>Ara</Button>
        </div>
      </Card>

      <div className="grid gap-2">
        {!submitted.trim() && (
          <EmptyState
            title="Arama yapmak için bir terim girin"
            description="Sonuçları görmek için en az 2 karakterle arama başlatın."
          />
        )}

        {submitted.trim().length === 1 && (
          <EmptyState
            title="Arama terimi çok kısa"
            description="Lütfen en az 2 karakter girip tekrar deneyin."
          />
        )}

        {enabled && (
          <DataState
            isLoading={searchQuery.isLoading}
            isError={searchQuery.isError}
            isEmpty={searchQuery.isSuccess && results.length === 0}
            errorMessage={searchQuery.error instanceof Error ? searchQuery.error.message : 'Arama sırasında bir hata oluştu.'}
            emptyTitle="Sonuç bulunamadı"
            emptyDescription="Farklı anahtar kelimelerle tekrar deneyin."
            onRetry={() => {
              void searchQuery.refetch();
            }}
          >
            {results.map((result) => (
              <Card key={result.id}>
                <p className="font-semibold">{result.title}</p>
                <p className="text-sm text-slate-300">Yazar: {result.author}</p>
              </Card>
            ))}
          </DataState>
        )}
      </div>
    </div>
  );
}
