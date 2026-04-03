'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { CACHE_PATCH_STRATEGY } from '../lib/query-patch-strategy';

export type FeedPost = {
  id: number;
  body: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  username: string;
};

export const feedQueryKey = ['feed', 1] as const;

export function useFeed(enabled: boolean) {
  return useQuery({
    queryKey: feedQueryKey,
    queryFn: () => apiFetch<{ posts: FeedPost[] }>('/feed?page=1'),
    enabled,
  });
}

export function useCreateFeedPost(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      apiFetch('/feed', {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    onSuccess: async () => {
      if (CACHE_PATCH_STRATEGY.FEED_CREATE_POST === 'invalidate') {
        await queryClient.invalidateQueries({ queryKey: feedQueryKey });
      }
      onSuccess?.();
    },
  });
}
