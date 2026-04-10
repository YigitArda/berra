'use client';

import { useRequireAuth } from '../../../hooks/use-require-auth';
import { NewThreadClient } from './new-thread-client';
import { Skeleton } from '../../../components/feedback/Skeleton';

export default function NewThreadPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={3} />;
  }

  return <NewThreadClient />;
}
