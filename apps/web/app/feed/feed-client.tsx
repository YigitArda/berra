'use client';

import { useState } from 'react';
import { DataState } from '../../components/data-state';
import { InlineAlert } from '../../components/feedback/InlineAlert';
import { Skeleton } from '../../components/feedback/Skeleton';
import { resolveFeedbackErrorMessage } from '../../components/feedback/messages';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useRequireAuth } from '../../hooks/use-require-auth';
import { useFeed, useCreateFeedPost } from '../../hooks/use-feed';

export function FeedClient() {
  const [body, setBody] = useState('');
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('following');
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const { isLoading: isSessionLoading, isAuthenticated } = useRequireAuth();

  const postsQuery = useFeed(isAuthenticated);
  const createMutation = useCreateFeedPost(() => setBody(''));

  if (isSessionLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={2} />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Liste / Feed</h1>
        <div className="flex gap-2">
          <Button size="sm" variant={activeTab === 'following' ? 'primary' : 'ghost'} onClick={() => setActiveTab('following')}>
            Takip ettiklerinden
          </Button>
          <Button size="sm" variant={activeTab === 'discover' ? 'primary' : 'ghost'} onClick={() => setActiveTab('discover')}>
            Keşfet
          </Button>
        </div>
      </div>

      <form
        aria-busy={createMutation.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(body);
        }}
        className="mb-5 grid gap-2"
      >
        <label htmlFor="feed-body" className="text-sm text-slate-300">
          Yeni gönderi
        </label>
        <textarea
          id="feed-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ne düşünüyorsun? (metin / bakım notu / foto / anket)"
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
          {(postsQuery.data?.posts ?? [])
            .filter((post) => (activeTab === 'discover' ? true : post.id % 2 === 0))
            .map((post) => {
              const isSaved = savedPostIds.includes(post.id);
              const commentsOpen = Boolean(expandedComments[post.id]);

              return (
                <Card key={post.id}>
                  <div className="font-bold">{post.username}</div>
                  <p className="mt-1">{post.body}</p>
                  <small>♥ {post.like_count} · 💬 {post.comment_count}</small>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={isSaved ? 'primary' : 'ghost'}
                      onClick={() => {
                        setSavedPostIds((prev) => (prev.includes(post.id) ? prev.filter((id) => id !== post.id) : [...prev, post.id]));
                      }}
                    >
                      {isSaved ? 'Kaydedildi' : 'Kaydet'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          await navigator.clipboard.writeText(`${window.location.origin}/feed#post-${post.id}`);
                        }
                      }}
                    >
                      Paylaş
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setBody(post.body)}>
                      Thread'e dönüştür
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    >
                      {commentsOpen ? 'Yorumları gizle' : 'Yorumları aç'}
                    </Button>
                  </div>

                  {commentsOpen && (
                    <div className="mt-3 rounded border border-slate-700 p-3">
                      <p className="text-sm text-slate-300">Inline yorum alanı (optimistic UX v1).</p>
                      <Badge className="mt-2" variant="outline">Yakında canlı yorum akışı</Badge>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      </DataState>
    </div>
  );
}
