'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { useToggleBookmark } from '../../../hooks/use-bookmarks';
import { useReportContent } from '../../../hooks/use-report';
import { useSession } from '../../../hooks/use-session';
import { apiFetch } from '../../../lib/api';
import { pushRecentThread } from '../../../lib/recent-threads';

type ThreadDetailResponse = {
  thread: {
    id: number;
    title: string;
    slug: string;
    is_pinned: boolean;
    is_locked: boolean;
    view_count: number;
    reply_count: number;
    created_at: string;
    tags?: string[];
    followers?: number;
  };
  posts: Array<{
    id: number;
    body: string;
    like_count: number;
    created_at: string;
    username: string;
    role: 'user' | 'mod' | 'admin';
  }>;
};

type RelatedThreadsResponse = {
  threads: Array<{
    id: number;
    slug: string;
    title: string;
    tags?: string[];
  }>;
};

export function ThreadClient({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSession();
  const [replyBody, setReplyBody] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const threadQuery = useQuery({
    queryKey: ['thread', slug],
    queryFn: () => apiFetch<ThreadDetailResponse>(`/forum/threads/${slug}?page=1`),
  });

  const relatedThreadsQuery = useQuery({
    queryKey: ['thread', 'related', slug],
    queryFn: () => apiFetch<RelatedThreadsResponse>('/forum/threads?page=1'),
  });

  useEffect(() => {
    if (threadQuery.data?.thread) {
      pushRecentThread({ slug: threadQuery.data.thread.slug, title: threadQuery.data.thread.title });
    }
  }, [threadQuery.data?.thread]);

  const createReplyMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>(`/forum/threads/${slug}/posts`, {
        method: 'POST',
        body: JSON.stringify({ body: replyBody }),
      }),
    onSuccess: async () => {
      setReplyBody('');
      await queryClient.invalidateQueries({ queryKey: ['thread', slug] });
    },
  });

  const followThreadMutation = useMutation({
    mutationFn: () => {
      const threadId = threadQuery.data?.thread.id;
      if (!threadId) return Promise.reject(new Error('Thread bulunamadı'));
      return apiFetch(`/discovery/threads/${threadId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });
    },
    onSuccess: () => setIsFollowing((prev) => !prev),
  });
  const bookmarkMutation = useToggleBookmark(threadQuery.data?.thread.id ?? 0);
  const reportMutation = useReportContent();

  const canReply = isAuthenticated && !threadQuery.data?.thread.is_locked;
  const posts = threadQuery.data?.posts ?? [];

  const headingBadges = useMemo(() => {
    const badges: string[] = [];
    if (threadQuery.data?.thread.is_pinned) badges.push('📌 Sabit');
    if (threadQuery.data?.thread.is_locked) badges.push('🔒 Kilitli');
    return badges;
  }, [threadQuery.data?.thread.is_locked, threadQuery.data?.thread.is_pinned]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="grid gap-4">
        {threadQuery.isError && (
          <Card>
            <p className="text-red-300">{(threadQuery.error as Error).message}</p>
          </Card>
        )}

        {threadQuery.data && (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold">{threadQuery.data.thread.title}</h1>
              <Button
                onClick={() => followThreadMutation.mutate()}
                disabled={!isAuthenticated || followThreadMutation.isPending}
              >
                {isFollowing ? 'Takibi bırak' : 'Bu konuyu takip et'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsBookmarked((prev) => !prev);
                  bookmarkMutation.mutate(!isBookmarked);
                }}
                disabled={!isAuthenticated || bookmarkMutation.isPending}
              >
                {isBookmarked ? '🔖 Kaydedildi' : '🔖 Kaydet'}
              </Button>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              👁 {threadQuery.data.thread.view_count} · 💬 {threadQuery.data.thread.reply_count} · 👥 {threadQuery.data.thread.followers ?? 0}
            </p>
            {headingBadges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                {headingBadges.map((badge) => (
                  <span key={badge} className="rounded-full border border-slate-700 px-2 py-1">{badge}</span>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {(threadQuery.data.thread.tags ?? []).map((tag) => (
                <Link key={tag} href={`/forum?tag=${tag}`}>
                  <Badge variant="outline">#{tag}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <div className="grid gap-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span className="font-semibold text-slate-200">{post.username}</span>
                <span>{new Date(post.created_at).toLocaleString('tr-TR')}</span>
              </div>
              <p className="whitespace-pre-wrap text-slate-100">{post.body}</p>
              <small className="mt-2 block text-slate-400">♥ {post.like_count}</small>
              <button
                type="button"
                className="mt-2 text-xs text-slate-300 underline"
                onClick={() => reportMutation.mutate({ targetType: 'post', targetId: post.id, reason: 'diğer' })}
              >
                Şikayet Et
              </button>
            </Card>
          ))}
        </div>

        <Card>
          <h2 className="mb-2 text-lg font-semibold">Yanıt yaz</h2>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            disabled={!canReply || createReplyMutation.isPending}
            rows={4}
            maxLength={2000}
            className="w-full rounded-md border border-slate-700 bg-slate-900 p-3"
            placeholder={isAuthenticated ? 'Yanıtınızı yazın...' : 'Yanıt yazmak için giriş yapın.'}
          />
          <div className="mt-3 flex items-center gap-3">
            <Button
              onClick={() => createReplyMutation.mutate()}
              disabled={!canReply || !replyBody.trim() || createReplyMutation.isPending}
            >
              {createReplyMutation.isPending ? 'Gönderiliyor...' : 'Yanıtla'}
            </Button>
            {!isAuthenticated && <span className="text-sm text-slate-400">Yanıt için oturum gerekli.</span>}
            {threadQuery.data?.thread.is_locked && <span className="text-sm text-amber-300">Konu kilitli.</span>}
          </div>
        </Card>
      </div>

      <div className="grid h-fit gap-4 lg:sticky lg:top-24">
        <Card>
          <h3 className="text-base font-semibold">Benzer konular</h3>
          <div className="mt-3 grid gap-2">
            {(relatedThreadsQuery.data?.threads ?? [])
              .filter((item) => item.slug !== slug)
              .slice(0, 6)
              .map((item) => (
                <Link key={item.id} href={`/thread/${item.slug}`} className="rounded border border-slate-700 p-2 text-sm hover:border-slate-500">
                  {item.title}
                </Link>
              ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-base font-semibold">Mod özeti</h3>
          <p className="mt-2 text-sm text-slate-300">Uzun thread’ler için otomatik özet kartı (v1 placeholder).</p>
        </Card>
      </div>
    </div>
  );
}
