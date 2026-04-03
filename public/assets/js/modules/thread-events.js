export function initThreadEvents({
  threadListEl,
  threadDetailEl,
  onThreadNavigate,
  onOpenProfile,
  onLikePost,
  onReportPost,
  onOpenImage,
  onReply,
}) {
  threadListEl?.addEventListener('click', (event) => {
    const profileTrigger = event.target.closest('[data-action="open-profile"]');
    if (profileTrigger) {
      event.stopPropagation();
      onOpenProfile(profileTrigger.dataset.user);
      return;
    }

    const row = event.target.closest('.thread-row[data-thread-target]');
    if (row) {
      onThreadNavigate(row.dataset.threadTarget);
    }
  });

  threadDetailEl?.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    const { action } = actionEl.dataset;

    if (action === 'open-profile') {
      event.preventDefault();
      onOpenProfile(actionEl.dataset.user);
      return;
    }

    if (action === 'like-post') {
      event.preventDefault();
      onLikePost(Number(actionEl.dataset.postId), actionEl);
      return;
    }

    if (action === 'report-post') {
      event.preventDefault();
      onReportPost(Number(actionEl.dataset.postId));
      return;
    }

    if (action === 'open-image') {
      event.preventDefault();
      onOpenImage(actionEl.dataset.src);
      return;
    }

    if (action === 'submit-reply') {
      event.preventDefault();
      onReply();
    }
  });
}
