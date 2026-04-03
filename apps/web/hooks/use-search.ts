'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SearchResponse } from '@berra/shared';
import { apiFetch } from '../lib/api';

export function useSearch(submittedQuery: string) {
  const enabled = useMemo(() => submittedQuery.trim().length > 1, [submittedQuery]);

  return useQuery({
    queryKey: ['search', submittedQuery],
    queryFn: () => apiFetch<SearchResponse>(`/search?q=${encodeURIComponent(submittedQuery)}&page=1`),
    enabled,
  });
}
