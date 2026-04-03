'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
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
  const pathname = usePathname();
  useRealtimeNotifications();
  const { isAuthenticated } = useSession();
  const logoutMutation = useLogout();
  useNotifications();

  const localBadgeCount = useAppStore((s) => s.localBadgeCount);
  const toastMessage = useAppStore((s) => s.toastMessage);
  const clearToast = useAppStore((s) => s.clearToast);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/forum', label: 'Forum' },
    { href: '/feed', label: 'Liste' },
    { href: '/following', label: 'Takip' },
    { href: '/models', label: 'Modeller' },
    { href: '/search', label: 'Arama' },
  ];

  const navLinkClass = (href: string) => {
    const isActive = pathname === href;

    return [
      'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
      isActive
        ? 'border-primary/60 bg-primary/15 text-primary'
        : 'border-transparent text-muted hover:border-slate-700 hover:bg-slate-900 hover:text-slate-100 active:border-primary/40 active:bg-primary/10 active:text-slate-100',
    ].join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto px-4 py-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(item.href)}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/notifications"
            className={`ml-auto flex items-center gap-2 ${navLinkClass('/notifications')}`}
            aria-current={pathname === '/notifications' ? 'page' : undefined}
          >
            Bildirimler{' '}
            {localBadgeCount > 0 && <Badge>{formatNotificationBadgeCount(localBadgeCount)}</Badge>}
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
            <Link href="/login" className={navLinkClass('/login')} aria-current={pathname === '/login' ? 'page' : undefined}>
              Giriş
            </Link>
          )}
        </nav>
      </header>
      {toastMessage && (
        <div className="fixed right-4 top-4 flex items-center gap-3 rounded-md bg-slate-800 px-4 py-2 text-sm shadow">
          <span>{toastMessage}</span>
          <button
            type="button"
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
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
