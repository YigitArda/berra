'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSession, sessionQueryKey } from '../lib/auth/session';

export function useSession(options: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    staleTime: 60_000,
    retry: false,
    enabled: options.enabled ?? true,
  });

  return {
    ...query,
    session: query.data,
    isAuthenticated: Boolean(query.data?.user),
  };
}
