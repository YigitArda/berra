'use client';

import { useState } from 'react';
import { useRequireAuth } from '../../hooks/use-require-auth';
import { useCreateFeedPost, useFeed } from '../../hooks/use-feed';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export function FeedClient() {
  const [body, setBody] = useState('');
  const { isLoading: isSessionLoading, isAuthenticated } = useRequireAuth();

  const postsQuery = useFeed(isAuthenticated);
  const createMutation = useCreateFeedPost(() => setBody(''));

  if (isSessionLoading) {
    return <p>Oturum doğrulanıyor...</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Liste / Feed</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(body);
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
      {createMutation.isError && <p className="mb-3 text-red-400">{toUserMessage(createMutation.error)}</p>}
      {postsQuery.isError && <p className="mb-3 text-red-400">{toUserMessage(postsQuery.error)}</p>}
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
