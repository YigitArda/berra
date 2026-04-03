'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export type PublicProfileResponse = {
  user: { id: number; username: string; bio: string | null; avatar_url: string | null; role: string; created_at: string };
  threads: Array<{ id: number; title: string; slug: string; reply_count: number; view_count: number; created_at: string; category_name: string }>;
  posts: Array<{ id: number; body: string; like_count: number; created_at: string; thread_title: string; thread_slug: string }>;
  cars: Array<{ id: number; brand: string; model: string; year: number; is_current: boolean }>;
};

export function usePublicProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => apiFetch<PublicProfileResponse>(`/profile/${encodeURIComponent(username)}`),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { bio: string }) =>
      apiFetch('/profile/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
