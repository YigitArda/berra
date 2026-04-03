'use client';

import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';
import { toUserMessage } from '../../lib/error-message';
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
        {searchQuery.isError && (
          <Card>
            <p className="text-red-400">{toUserMessage(searchQuery.error)}</p>
          </Card>
        )}
        {searchQuery.isSuccess && searchQuery.data.items.length === 0 && submitted.trim().length > 1 && (
          <Card>
            <p>Sonuç bulunamadı.</p>
          </Card>
        )}
        {(searchQuery.data?.items ?? []).map((item) => (
          <Card key={item.id}>
            <p className="font-semibold">#{item.id}</p>
            <p>{item.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
