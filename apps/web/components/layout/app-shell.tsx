'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useRealtimeNotifications } from '../../hooks/use-realtime-notifications';
import { useAppStore } from '../../store/app-store';
import { Badge } from '../ui/badge';

export function AppShell({ children }: { children: ReactNode }) {
  useRealtimeNotifications();
  const unread = useAppStore((s) => s.unreadCount);
  const toastMessage = useAppStore((s) => s.toastMessage);

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
        </nav>
      </header>
      {toastMessage && (
        <div className="fixed right-4 top-4 rounded-md bg-slate-800 px-4 py-2 text-sm shadow">{toastMessage}</div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
