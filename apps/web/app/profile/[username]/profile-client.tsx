'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { usePublicProfile } from '../../../hooks/use-profile';
import { useSession } from '../../../hooks/use-session';
import { formatRelativeTime } from '../../../lib/format-time';

export function ProfileClient({ username }: { username: string }) {
  const [tab, setTab] = useState<'posts' | 'threads'>('posts');
  const profileQuery = usePublicProfile(username);
  const { session } = useSession();

  const isMe = useMemo(() => session?.user?.username === username, [session?.user?.username, username]);

  if (profileQuery.isError) return <Card>Profil yüklenemedi. Lütfen sayfayı yenileyin.</Card>;
  if (!profileQuery.data) return <Card>Profil yükleniyor...</Card>;

  const { user, threads, posts } = profileQuery.data;
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-800 font-bold">{initials}</div>
            <div>
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <p className="text-sm text-slate-400">Katılım: {new Date(user.created_at).toLocaleDateString('tr-TR')}</p>
            </div>
          </div>
          {isMe && <Link href="/profile/me/edit"><Button>Düzenle</Button></Link>}
        </div>
        <p className="mt-3 text-sm text-slate-300">{user.bio || 'Henüz bio girilmemiş.'}</p>
      </Card>

      <Card>
        <div className="mb-3 flex gap-2">
          <Button size="sm" variant={tab === 'posts' ? 'primary' : 'ghost'} onClick={() => setTab('posts')}>Gönderiler</Button>
          <Button size="sm" variant={tab === 'threads' ? 'primary' : 'ghost'} onClick={() => setTab('threads')}>Konular</Button>
        </div>

        {tab === 'posts' && (
          <div className="grid gap-2">
            {posts.length === 0 ? (
              <p className="text-sm text-slate-400">Henüz gönderi yok.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="rounded border border-slate-700 p-3 text-sm">
                  <p>{post.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Link href={`/thread/${post.thread_slug}`} className="text-xs text-blue-300 hover:underline">{post.thread_title}</Link>
                    <span className="text-xs text-slate-500">{formatRelativeTime(post.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'threads' && (
          <div className="grid gap-2">
            {threads.length === 0 ? (
              <p className="text-sm text-slate-400">Henüz konu açılmamış.</p>
            ) : (
              threads.map((thread) => (
                <Link key={thread.id} href={`/thread/${thread.slug}`} className="rounded border border-slate-700 p-3 text-sm hover:border-slate-500">
                  <p className="font-semibold">{thread.title}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-slate-400">{thread.category_name} · 💬 {thread.reply_count} · 👁 {thread.view_count}</p>
                    <span className="text-xs text-slate-500">{formatRelativeTime(thread.created_at)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
