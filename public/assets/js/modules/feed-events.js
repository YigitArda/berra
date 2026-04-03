export function initFeedEvents({
  feedListEl,
  onOpenPost,
  onOpenThread,
  onOpenProfile,
  onToggleMenu,
  onMenuAction,
  onShare,
  onToggleCommentReply,
  onSubmitReply,
  onReplyKeydown,
  onCloseMenus,
}) {
  feedListEl?.addEventListener('click', (event) => {
    const actionable = event.target.closest('[data-action]');

    if (!actionable) {
      const card = event.target.closest('.feed-item[data-post-id]');
      if (card) onOpenPost(event, Number(card.dataset.postId));
      return;
    }

    event.stopPropagation();
    const { action } = actionable.dataset;

    if (action === 'open-thread') {
      onOpenThread(Number(actionable.dataset.postId));
      return;
    }

    if (action === 'share-feed') {
      onShare(Number(actionable.dataset.postId), actionable);
      return;
    }

    if (action === 'open-profile') {
      onOpenProfile(actionable.dataset.user);
      return;
    }

    if (action === 'toggle-post-menu') {
      onToggleMenu(actionable.dataset.menuId);
      return;
    }

    if (action.startsWith('menu-')) {
      onMenuAction(action, actionable.dataset);
      onCloseMenus();
      return;
    }

    if (action === 'toggle-comment-reply') {
      onToggleCommentReply(Number(actionable.dataset.postId), Number(actionable.dataset.commentId));
      return;
    }

    if (action === 'submit-comment-reply') {
      onSubmitReply(Number(actionable.dataset.postId), Number(actionable.dataset.commentId));
    }
  });

  feedListEl?.addEventListener('keydown', (event) => {
    const input = event.target.closest('[data-action="reply-keydown"]');
    if (!input) return;
    onReplyKeydown(event, Number(input.dataset.postId), Number(input.dataset.commentId));
  });
}
