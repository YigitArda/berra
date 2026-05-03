'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useLogout } from '../../hooks/use-logout';
import { useNotifications } from '../../hooks/use-notifications';
import { useRealtimeNotifications } from '../../hooks/use-realtime-notifications';
import { useSession } from '../../hooks/use-session';
import { useAppStore } from '../../store/app-store';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

function formatNotificationBadgeCount(count: number) {
  if (count > 99) return '99+';
  return String(count);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldCheckSession = [
    '/bookmarks',
    '/dashboard',
    '/feed',
    '/following',
    '/forum/new',
    '/notifications',
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const { isAuthenticated } = useSession({ enabled: shouldCheckSession });
  const logoutMutation = useLogout();
  const notifications = useNotifications(isAuthenticated);
  useRealtimeNotifications(isAuthenticated);

  const localBadgeCount = useAppStore((s) => s.localBadgeCount);
  const toastMessage = useAppStore((s) => s.toastMessage);
  const clearToast = useAppStore((s) => s.clearToast);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const badgeCount = localBadgeCount || notifications.unreadCount;
  const isForumSurface = pathname === '/' || pathname === '/forum';
  const navItems = [
    { href: '/forum', label: 'Forum' },
    { href: '/feed', label: 'Feed' },
    { href: '/karsilastir', label: 'Karşılaştır' },
    { href: '/rehber', label: 'Rehber' },
    { href: '/sanayi', label: 'Sanayi' },
    { href: '/search', label: 'Arama' },
  ];

  const navLinkClass = (href: string) => {
    const isActive = pathname === href || (href === '/forum' && pathname === '/');

    return [
      'shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
      isActive
        ? 'bg-primary text-white shadow-sm shadow-blue-950/20'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white dark:active:bg-slate-800',
    ].join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <nav className="mx-auto grid max-w-6xl grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 lg:grid-cols-[auto_1fr_auto]">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">
              AV
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-black text-slate-950 dark:text-white">
                arabalariseviyoruz
              </span>
              <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                forum akışı
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-hide">
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className={navLinkClass('/dashboard')}
                aria-current={pathname === '/dashboard' ? 'page' : undefined}
              >
                Panel
              </Link>
            )}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(item.href)}
                aria-current={
                  pathname === item.href || (item.href === '/forum' && pathname === '/')
                    ? 'page'
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href="/following"
                className={navLinkClass('/following')}
                aria-current={pathname === '/following' ? 'page' : undefined}
              >
                Takip
              </Link>
            )}
          </div>

          <div className="col-span-2 flex items-center justify-end gap-2 lg:col-span-1">
            {isAuthenticated && (
              <Link
                href="/notifications"
                className={`flex shrink-0 items-center gap-2 ${navLinkClass('/notifications')}`}
                aria-current={pathname === '/notifications' ? 'page' : undefined}
              >
                Bildirimler
                {badgeCount > 0 && <Badge>{formatNotificationBadgeCount(badgeCount)}</Badge>}
              </Link>
            )}
            {isAuthenticated ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? 'Çıkılıyor...' : 'Çıkış'}
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className={navLinkClass('/login')}
                  aria-current={pathname === '/login' ? 'page' : undefined}
                >
                  Giriş
                </Link>
                <Link
                  href="/register"
                  className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Katıl
                </Link>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
            >
              {theme === 'dark' ? 'Açık' : 'Koyu'}
            </Button>
          </div>
        </nav>
      </header>
      {toastMessage && (
        <div
          className="fixed right-4 top-4 z-[60] flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow dark:border-slate-700 dark:bg-slate-800"
          role="alert"
          aria-live="polite"
        >
          <span className="text-slate-900 dark:text-slate-100">{toastMessage}</span>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-600 dark:focus-visible:ring-offset-slate-950"
            onClick={clearToast}
          >
            Kapat
          </button>
        </div>
      )}
      <main className={isForumSurface ? 'w-full py-4' : 'mx-auto max-w-6xl px-4 py-6'}>
        {children}
      </main>
    </div>
  );
}
