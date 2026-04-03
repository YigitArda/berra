'use client';

import Link from 'next/link';
import { ReactNode, useEffect } from 'react';
import { useLogout } from '../../hooks/use-logout';
import { useRealtimeNotifications } from '../../hooks/use-realtime-notifications';
import { useSession } from '../../hooks/use-session';
import { useNotifications } from '../../hooks/use-notifications';
import { useAppStore } from '../../store/app-store';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

function formatNotificationBadgeCount(count: number) {
  if (count > 99) return '99+';
  return String(count);
}

export function AppShell({ children }: { children: ReactNode }) {
  useRealtimeNotifications();
  const { isAuthenticated } = useSession();
  const logoutMutation = useLogout();
  const notificationsQuery = useNotifications();

  const localBadgeCount = useAppStore((s) => s.localBadgeCount);
  const setLocalBadgeCount = useAppStore((s) => s.setLocalBadgeCount);
  const toastMessage = useAppStore((s) => s.toastMessage);
  const clearToast = useAppStore((s) => s.clearToast);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/feed">Liste</Link>
          <Link href="/search">Arama</Link>
          <Link href="/notifications" className="ml-auto">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true">🔔</span>
              <span>Bildirimler</span>
              {localBadgeCount > 0 && (
                <Badge
                  className="min-w-6 justify-center whitespace-nowrap px-1.5 text-center leading-5"
                  title={`${localBadgeCount} okunmamış bildirim`}
                >
                  {formatNotificationBadgeCount(localBadgeCount)}
                </Badge>
              )}
            </span>
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
            onClick={clearToast}
          >
            Kapat
          </button>
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
