'use client';

import { useRequireAuth } from '../../hooks/use-require-auth';
import { NotificationsClient } from './notifications-client';
import { Skeleton } from '../../components/feedback/Skeleton';

export default function NotificationsPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={3} />;
  }

  return <NotificationsClient />;
}
