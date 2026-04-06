'use client';

import Link from 'next/link';
import { Skeleton } from '../../components/feedback/Skeleton';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { useFeed } from '../../hooks/use-feed';
import { useNotifications } from '../../hooks/use-notifications';
import { useSession } from '../../hooks/use-session';
import { useAppStore } from '../../store/app-store';

export function DashboardClient() {
  const { isLoading, session } = useSession();
  const notifications = useNotifications();
  const feed = useFeed(true, 1);
  const unread = useAppStore((s) => s.localBadgeCount);

  if (isLoading) {
    return <Skeleton title="Dashboard yükleniyor..." lines={3} />;
  }

  const user = session?.user;

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hoş geldin, {user?.username}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline">Rol: {user?.role ?? 'user'}</Badge>
          <Badge variant="neutral">Okunmamış bildirim: {unread || notifications.unreadCount}</Badge>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Son gönderiler</h2>
          <div className="mt-3 grid gap-2">
            {(feed.data?.posts ?? []).slice(0, 5).map((post) => (
              <div key={post.id} className="rounded border border-slate-700 p-2">
                <p className="text-sm font-semibold">{post.username}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{post.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Hızlı erişim</h2>
          <div className="mt-3 grid gap-2">
            <Link href="/forum" className="rounded border border-slate-700 p-3 text-sm hover:border-slate-500">Forum</Link>
            <Link href="/feed" className="rounded border border-slate-700 p-3 text-sm hover:border-slate-500">Feed</Link>
            <Link href={`/profile/${user?.username ?? ''}`} className="rounded border border-slate-700 p-3 text-sm hover:border-slate-500">Profil</Link>
            <Link href="/bookmarks" className="rounded border border-slate-700 p-3 text-sm hover:border-slate-500">Kayıtlılarım</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
