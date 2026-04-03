'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { apiFetch } from '../../lib/api';

type FeedPost = {
  id: number;
  body: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  username: string;
};

export default function FeedPage() {
  const [body, setBody] = useState('');
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['feed', 1],
    queryFn: () => apiFetch<{ posts: FeedPost[] }>('/feed?page=1'),
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
          className="rounded-md border border-slate-700 bg-slate-900 p-3"
        />
        <Button type="submit" disabled={createMutation.isPending}>Paylaş</Button>
      </form>
      {createMutation.isError && <p className="mb-3 text-red-400">{(createMutation.error as Error).message}</p>}
      <div className="grid gap-3">
        {(postsQuery.data?.posts ?? []).map((post) => (
          <Card key={post.id}>
            <div className="font-bold">{post.username}</div>
            <p>{post.body}</p>
            <small>♥ {post.like_count} · 💬 {post.comment_count}</small>
          </Card>
        ))}
      </div>
    </div>
  );
}
