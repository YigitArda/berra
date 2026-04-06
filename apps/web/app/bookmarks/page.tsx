'use client';

import Link from 'next/link';
import { Card } from '../../components/ui/card';
import { useBookmarks } from '../../hooks/use-bookmarks';

export default function BookmarksPage() {
  const bookmarksQuery = useBookmarks();

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kayıtlılarım</h1>
      </Card>
      <div className="grid gap-3">
        {(bookmarksQuery.data?.bookmarks ?? []).map((item) => (
          <Card key={item.bookmark_id}>
            <Link href={`/thread/${item.slug}`} className="text-lg font-semibold text-slate-900 hover:underline dark:text-slate-100">{item.title}</Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.category_name}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
