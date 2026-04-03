'use client';

import { useRequireAuth } from '../../hooks/use-require-auth';
import { useAppStore } from '../../store/app-store';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export function NotificationsClient() {
  const { isLoading } = useRequireAuth();
  const unread = useAppStore((s) => s.unreadCount);
  const setUnreadCount = useAppStore((s) => s.setUnreadCount);

  if (isLoading) {
    return <p>Oturum doğrulanıyor...</p>;
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold">Bildirim Merkezi</h1>
      <p className="mt-2 text-slate-300">Okunmamış: {unread}</p>
      <Button className="mt-3" onClick={() => setUnreadCount(0)}>Tümünü okundu işaretle</Button>
    </Card>
  );
}
