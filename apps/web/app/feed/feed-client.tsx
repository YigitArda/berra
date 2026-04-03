'use client';

import { useEffect, useState } from 'react';
import { DataState } from '../../components/data-state';
import { InlineAlert } from '../../components/feedback/InlineAlert';
import { Skeleton } from '../../components/feedback/Skeleton';
import { resolveFeedbackErrorMessage } from '../../components/feedback/messages';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useRequireAuth } from '../../hooks/use-require-auth';
import { useCreateFeedComment, useCreateFeedPost, useFeed, useFeedComments, useLikeFeedPost } from '../../hooks/use-feed';
import { useReportContent } from '../../hooks/use-report';
import { getSocket, releaseSocket, SOCKET_EVENTS } from '../../lib/socket';

type FeedPostCardProps = {
  post: {
    id: number;
    username: string;
    body: string;
    like_count: number;
    comment_count: number;
  };
};

function FeedPostCard({ post }: FeedPostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [optimisticLikes, setOptimisticLikes] = useState(post.like_count);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const likeMutation = useLikeFeedPost(post.id);
  const reportMutation = useReportContent();
  const commentsQuery = useFeedComments(post.id, isCommentsOpen);
  const createCommentMutation = useCreateFeedComment(post.id);

  const toggleLike = async () => {
    const next = !isLiked;
    setIsLiked(next);
    setOptimisticLikes((prev) => Math.max(prev + (next ? 1 : -1), 0));

    try {
      const res = await likeMutation.mutateAsync(next);
      setOptimisticLikes(res.like_count);
    } catch {
      setIsLiked(!next);
      setOptimisticLikes((prev) => Math.max(prev + (next ? -1 : 1), 0));
    }
  };

  return (
    <Card>
      <div className="font-bold">{post.username}</div>
      <p className="mt-1">{post.body}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant={isLiked ? 'primary' : 'ghost'} onClick={toggleLike} disabled={likeMutation.isPending}>
          ♥ {optimisticLikes}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsCommentsOpen((prev) => !prev)}>
          💬 {post.comment_count}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => reportMutation.mutate({ targetType: 'feed_post', targetId: post.id, reason: 'diğer' })}>
          ⋯ Şikayet Et
        </Button>
      </div>

      {isCommentsOpen && (
        <div className="mt-3 rounded-md border border-slate-700 p-3">
          {commentsQuery.isLoading && <Skeleton lines={2} />}
          <div className="grid gap-2">
            {(commentsQuery.data?.comments ?? []).map((comment) => (
              <div key={comment.id} className="rounded border border-slate-700 p-2 text-sm">
                <p className="font-semibold">{comment.username}</p>
                <p>{comment.body}</p>
              </div>
            ))}
          </div>

          <form
            className="mt-3 grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createCommentMutation.mutate(commentText, {
                onSuccess: () => setCommentText(''),
              });
            }}
          >
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              className="rounded border border-slate-700 bg-slate-900 p-2"
              placeholder="Yorum yaz..."
            />
            <Button type="submit" size="sm" disabled={!commentText.trim() || createCommentMutation.isPending}>
              {createCommentMutation.isPending ? 'Gönderiliyor...' : 'Yorum gönder'}
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}

export function FeedClient() {
  const [body, setBody] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('discover');
  const [loadedPosts, setLoadedPosts] = useState<Array<FeedPostCardProps['post']>>([]);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const { isLoading: isSessionLoading, isAuthenticated } = useRequireAuth();

  const postsQuery = useFeed(isAuthenticated, page, activeTab);
  const createMutation = useCreateFeedPost(() => setBody(''));

  useEffect(() => {
    setLoadedPosts([]);
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    const socket = getSocket();
    const onContentUpdated = (payload: { action: string }) => {
      if (payload.action === 'created') {
        setHasNewPosts(true);
      }
    };
    socket.on(SOCKET_EVENTS.contentUpdated, onContentUpdated);
    return () => {
      socket.off(SOCKET_EVENTS.contentUpdated, onContentUpdated);
      releaseSocket();
    };
  }, []);

  useEffect(() => {
    const incoming = postsQuery.data?.posts ?? [];
    if (incoming.length === 0) return;

    setLoadedPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newPosts = incoming.filter((p) => !existingIds.has(p.id));
      return newPosts.length ? [...prev, ...newPosts] : prev;
    });
  }, [postsQuery.data?.posts]);

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
        <p className="text-right text-xs text-slate-400">{body.length}/500</p>
        <Button type="submit" disabled={createMutation.isPending || body.trim().length === 0}>
          {createMutation.isPending ? 'Paylaşılıyor...' : 'Paylaş'}
        </Button>
      </form>

      {createMutation.isError && (
        <InlineAlert className="mb-3" variant="error" message={resolveFeedbackErrorMessage(createMutation.error)} />
      )}

      {hasNewPosts && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-blue-800 bg-blue-950/40 px-4 py-2">
          <span className="text-sm text-blue-200">Yeni gönderiler mevcut</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setHasNewPosts(false);
              setLoadedPosts([]);
              setPage(1);
            }}
          >
            Yenile
          </Button>
        </div>
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
          {(loadedPosts.length ? loadedPosts : postsQuery.data?.posts ?? []).map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>

        {(postsQuery.data?.posts.length ?? 0) > 0 && (
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" onClick={() => setPage((prev) => prev + 1)}>
              Daha fazla yükle
            </Button>
          </div>
        )}
      </DataState>
    </div>
  );
}
