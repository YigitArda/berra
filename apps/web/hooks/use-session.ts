'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSession, sessionQueryKey } from '../lib/auth/session';

export function useSession() {
  const query = useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    staleTime: 60_000,
    retry: false,
  });

  return {
    ...query,
    session: query.data,
    isAuthenticated: Boolean(query.data?.user),
  };
}
