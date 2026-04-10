'use client';

import { useRequireAuth } from '../../hooks/use-require-auth';
import { FeedClient } from './feed-client';
import { Skeleton } from '../../components/feedback/Skeleton';

export default function FeedPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={3} />;
  }

  return <FeedClient />;
}
