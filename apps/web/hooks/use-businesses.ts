'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

type Business = {
  id: number;
  name: string;
  slug: string;
  category: string;
  city: string;
  phone: string | null;
  avg_rating: string;
  open_time: string | null;
  close_time: string | null;
};

export function useBusinesses(category: string, city: string) {
  // CUTOVER_PROXY: `/businesses` requests go through Nest API and are proxied during migration.
  const params = new URLSearchParams();
  if (category) params.set('cat', category);
  if (city) params.set('city', city);

  return useQuery({
    queryKey: ['businesses', category, city],
    queryFn: () => apiFetch<{ businesses: Business[] }>(`/businesses?${params.toString()}`),
  });
}

export function useSubmitBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; category: string; address: string; city: string; phone?: string }) =>
      apiFetch('/businesses', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
}
