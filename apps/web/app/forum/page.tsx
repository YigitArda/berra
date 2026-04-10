'use client';

import { useRequireAuth } from '../../hooks/use-require-auth';
import { ForumClient } from './forum-client';
import { Skeleton } from '../../components/feedback/Skeleton';

export default function ForumPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={3} />;
  }

  return <ForumClient />;
}
