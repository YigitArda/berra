'use client';

import { useEffect, useState } from 'react';
import { DataState } from '../../components/data-state';
import { InlineAlert } from '../../components/feedback/InlineAlert';
import { Skeleton } from '../../components/feedback/Skeleton';
import { resolveFeedbackErrorMessage } from '../../components/feedback/messages';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useRequireAuth } from '../../hooks/use-require-auth';
import { useCreateFeedComment, useCreateFeedPost, useFeed, useFeedComments, useLikeFeedPost } from '../../hooks/use-feed';
import { useReportContent } from '../../hooks/use-report';

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
  const [loadedPosts, setLoadedPosts] = useState<Array<FeedPostCardProps['post']>>([]);
  const { isLoading: isSessionLoading, isAuthenticated } = useRequireAuth();

  const postsQuery = useFeed(isAuthenticated, page);
  const createMutation = useCreateFeedPost(() => setBody(''));

  useEffect(() => {
    const incoming = postsQuery.data?.posts ?? [];
    if (incoming.length === 0) return;

    setLoadedPosts((prev) => {
      const next = [...prev];
      for (const post of incoming) {
        if (!next.some((item) => item.id === post.id)) {
          next.push(post);
        }
      }
      return next;
    });
  }, [postsQuery.data?.posts]);

  if (isSessionLoading) {
    return <Skeleton title="Oturum doğrulanıyor..." lines={2} />;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Liste / Feed</h1>
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
          {(loadedPosts.length ? loadedPosts : postsQuery.data?.posts ?? []).map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="mt-4 flex justify-center">
          <Button variant="ghost" onClick={() => setPage((prev) => prev + 1)}>
            Daha fazla yükle
          </Button>
        </div>
      </DataState>
    </div>
  );
}
