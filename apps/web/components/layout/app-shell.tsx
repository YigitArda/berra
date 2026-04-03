'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useLogout } from '../../hooks/use-logout';
import { useRealtimeNotifications } from '../../hooks/use-realtime-notifications';
import { useSession } from '../../hooks/use-session';
import { useAppStore } from '../../store/app-store';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function AppShell({ children }: { children: ReactNode }) {
  useRealtimeNotifications();
  const unread = useAppStore((s) => s.unreadCount);
  const toastMessage = useAppStore((s) => s.toastMessage);
  const setToastMessage = useAppStore((s) => s.setToastMessage);
  const { isAuthenticated } = useSession();
  const logoutMutation = useLogout();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/feed">Liste</Link>
          <Link href="/search">Arama</Link>
          <Link href="/notifications" className="ml-auto flex items-center gap-2">
            Bildirimler {unread > 0 && <Badge>{unread}</Badge>}
          </Link>
          {isAuthenticated ? (
            <Button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? 'Çıkış yapılıyor...' : 'Çıkış'}
            </Button>
          ) : (
            <Link href="/login">Giriş</Link>
          )}
        </nav>
      </header>
      {toastMessage && (
        <div className="fixed right-4 top-4 flex items-center gap-3 rounded-md bg-slate-800 px-4 py-2 text-sm shadow">
          <span>{toastMessage}</span>
          <button
            type="button"
            className="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600"
            onClick={() => setToastMessage(null)}
          >
            Kapat
          </button>
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
