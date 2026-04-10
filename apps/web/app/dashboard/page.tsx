'use client';

import { useRequireAuth } from '../../hooks/use-require-auth';
import { DashboardClient } from './dashboard-client';
import { Skeleton } from '../../components/feedback/Skeleton';

export default function DashboardPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={3} />;
  }

  return <DashboardClient />;
}
