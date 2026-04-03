'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';
import { sessionQueryKey } from '../lib/auth/session';

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>('/auth/logout', {
        method: 'POST',
      }),
    onSuccess: async () => {
      queryClient.setQueryData(sessionQueryKey, null);
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      router.replace('/login');
      router.refresh();
    },
  });
}
