'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DataState } from '../../components/data-state';
import { InlineAlert } from '../../components/feedback/InlineAlert';
import { Skeleton } from '../../components/feedback/Skeleton';
import { resolveFeedbackErrorMessage } from '../../components/feedback/messages';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useRequireAuth } from '../../hooks/use-require-auth';
import { apiFetch } from '../../lib/api';

type FeedPost = {
  id: number;
  body: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  username: string;
};

export function FeedClient() {
  const [body, setBody] = useState('');
  const queryClient = useQueryClient();
  const { isLoading: isSessionLoading, isAuthenticated } = useRequireAuth();

  const postsQuery = useQuery({
    queryKey: ['feed', 1],
    queryFn: () => apiFetch<{ posts: FeedPost[] }>('/feed?page=1'),
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/feed', {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    onSuccess: async () => {
      setBody('');
      await queryClient.invalidateQueries({ queryKey: ['feed', 1] });
    },
  });

  if (isSessionLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={2} />;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Liste / Feed</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="mb-5 grid gap-2"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ne düşünüyorsun?"
          maxLength={500}
          rows={3}
          disabled={createMutation.isPending}
          className="rounded-md border border-slate-700 bg-slate-900 p-3 disabled:opacity-60"
        />
        <Button type="submit" disabled={createMutation.isPending || body.trim().length === 0}>
          {createMutation.isPending ? 'Paylaşılıyor...' : 'Paylaş'}
        </Button>
      </form>

      {createMutation.isError && (
        <InlineAlert className="mb-3" variant="error" message={resolveFeedbackErrorMessage(createMutation.error)} />
      )}

      <DataState
        isLoading={postsQuery.isLoading}
        isError={postsQuery.isError}
        isEmpty={postsQuery.isSuccess && (postsQuery.data?.posts.length ?? 0) === 0}
        error={postsQuery.error}
        loadingTitle="Gönderiler yükleniyor..."
        emptyTitle="Henüz gönderi yok"
        emptyDescription="İlk gönderiyi paylaşarak feed'i başlatın."
        onRetry={() => postsQuery.refetch()}
        isRetrying={postsQuery.isRefetching}
      >
        <div className="grid gap-3">
          {(postsQuery.data?.posts ?? []).map((post) => (
            <Card key={post.id}>
              <div className="font-bold">{post.username}</div>
              <p>{post.body}</p>
              <small>♥ {post.like_count} · 💬 {post.comment_count}</small>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}
