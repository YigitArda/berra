'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export type ForumThread = {
  id: number;
  title: string;
  slug: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  created_at: string;
  author: string;
};

export type ForumPost = {
  id: number;
  body: string;
  like_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
  username: string;
  avatar_url: string | null;
  role: 'user' | 'mod' | 'admin';
};

export type ForumThreadDetail = {
  thread: ForumThread & {
    tags: string[];
    followers: number;
  };
  posts: ForumPost[];
  page: number;
  limit: number;
};

export function useForum(category: string, page: number) {
  // CUTOVER_PROXY: `/forum/*` requests go through Nest API and are proxied during migration.
  const query =
    category === 'all'
      ? `/forum/threads?page=${page}`
      : `/forum/threads?category=${encodeURIComponent(category)}&page=${page}`;

  return useQuery({
    queryKey: ['forum', category, page],
    queryFn: () => apiFetch<{ threads: ForumThread[] }>(query),
    retry: false,
  });
}

export function useForumThread(slug: string | null, page: number) {
  return useQuery({
    queryKey: ['forum-thread', slug, page],
    queryFn: () => apiFetch<ForumThreadDetail>(`/forum/threads/${slug}?page=${page}`),
    enabled: Boolean(slug),
    retry: false,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title: string; body: string; category_id: number }) =>
      apiFetch<{ message: string; slug: string }>('/forum/threads', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });
}
