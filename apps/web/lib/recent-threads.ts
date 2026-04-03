export type RecentThreadItem = {
  slug: string;
  title: string;
  viewedAt: string;
};

const STORAGE_KEY = 'berra_recent_threads_v1';
const MAX_ITEMS = 8;

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readRecentThreads(): RecentThreadItem[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is RecentThreadItem => {
        if (!item || typeof item !== 'object') return false;
        const candidate = item as Partial<RecentThreadItem>;
        return typeof candidate.slug === 'string' && typeof candidate.title === 'string' && typeof candidate.viewedAt === 'string';
      })
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function pushRecentThread(item: { slug: string; title: string }) {
  if (!isBrowser()) return;

  const next: RecentThreadItem = {
    slug: item.slug,
    title: item.title,
    viewedAt: new Date().toISOString(),
  };

  const existing = readRecentThreads().filter((thread) => thread.slug !== next.slug);
  const payload = [next, ...existing].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
