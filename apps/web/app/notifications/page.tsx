'use client';

import { EmptyState } from '../../components/empty-state';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAppStore } from '../../store/app-store';

export default function NotificationsPage() {
  const unread = useAppStore((s) => s.unreadCount);
  const setUnreadCount = useAppStore((s) => s.setUnreadCount);

  if (unread === 0) {
    return (
      <EmptyState
        title="Yeni bildirim yok"
        description="Yeni bir etkinlik olduğunda burada görünecek."
      />
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold">Bildirim Merkezi</h1>
      <p className="mt-2 text-slate-300">Okunmamış: {unread}</p>
      <Button className="mt-3" onClick={() => setUnreadCount(0)}>
        Tümünü okundu işaretle
      </Button>
    </Card>
  );
}
