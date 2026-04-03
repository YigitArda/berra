'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from './use-session';

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading, isFetching, isAuthenticated } = useSession();

  useEffect(() => {
    if (isLoading || isFetching) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isFetching, isLoading, pathname, router]);

  return {
    session,
    isLoading: isLoading || isFetching,
    isAuthenticated,
  };
}
