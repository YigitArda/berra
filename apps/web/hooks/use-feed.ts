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

export type FeedComment = {
  id: number;
  body: string;
  created_at: string;
  username: string;
};

export const feedQueryKey = (page: number, tab?: string) => ['feed', page, tab] as const;

export function useFeed(enabled: boolean, page = 1, tab: 'following' | 'discover' = 'discover') {
  return useQuery({
    queryKey: feedQueryKey(page, tab),
    queryFn: () => apiFetch<{ posts: FeedPost[]; page: number; limit: number }>(`/feed?page=${page}&tab=${tab}`),
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
        await queryClient.invalidateQueries({ queryKey: ['feed'] });
      }
      onSuccess?.();
    },
  });
}

export function useLikeFeedPost(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (like: boolean) =>
      apiFetch<{ like_count: number }>(`/feed/${postId}/like`, {
        method: like ? 'POST' : 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useFeedComments(postId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['feed', 'comments', postId],
    queryFn: () => apiFetch<{ comments: FeedComment[] }>(`/feed/${postId}/comments`),
    enabled,
  });
}

export function useCreateFeedComment(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<{ comment: FeedComment }>(`/feed/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      void queryClient.invalidateQueries({ queryKey: ['feed', 'comments', postId] });
    },
  });
}
