'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { useRequireAuth } from '../../../hooks/use-require-auth';
import { apiFetch } from '../../../lib/api';

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

export function ThreadClient({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useRequireAuth();
  const [replyBody, setReplyBody] = useState('');

  const threadQuery = useQuery({
    queryKey: ['thread', slug],
    queryFn: () => apiFetch<ThreadDetailResponse>(`/forum/threads/${slug}?page=1`),
  });

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

  const canReply = isAuthenticated && !threadQuery.data?.thread.is_locked;
  const posts = threadQuery.data?.posts ?? [];

  const headingBadges = useMemo(() => {
    const badges: string[] = [];
    if (threadQuery.data?.thread.is_pinned) badges.push('📌 Sabit');
    if (threadQuery.data?.thread.is_locked) badges.push('🔒 Kilitli');
    return badges;
  }, [threadQuery.data?.thread.is_locked, threadQuery.data?.thread.is_pinned]);

  return (
    <div className="grid gap-4">
      {threadQuery.isError && (
        <Card>
          <p className="text-red-300">{(threadQuery.error as Error).message}</p>
        </Card>
      )}

      {threadQuery.data && (
        <Card>
          <h1 className="text-2xl font-bold">{threadQuery.data.thread.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            👁 {threadQuery.data.thread.view_count} · 💬 {threadQuery.data.thread.reply_count}
          </p>
          {headingBadges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
              {headingBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-slate-700 px-2 py-1">{badge}</span>
              ))}
            </div>
          )}
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
  );
}
