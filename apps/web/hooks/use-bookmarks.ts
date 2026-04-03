'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export function useBookmarks() {
  // LEGACY_DEPENDENCY: `/bookmarks` endpoints are still served by legacy Express until Nest bookmarks module is migrated.
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => apiFetch<{ bookmarks: Array<{ id: number; bookmark_id: number; title: string; slug: string; category_name: string; created_at: string }> }>('/bookmarks?page=1'),
  });
}

export function useToggleBookmark(threadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nextState: boolean) =>
      apiFetch(`/bookmarks/${threadId}`, {
        method: nextState ? 'POST' : 'DELETE',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}
