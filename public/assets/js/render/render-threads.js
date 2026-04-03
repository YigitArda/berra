export function renderThreadsModule({ list, escapeHtml }) {
  const el = document.getElementById('threadList');
  el.innerHTML = '';
  list.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'thread-row' + (t.pinned ? ' pinned' : '');
    row.innerHTML = `
      <div class="thread-main">
        <div class="thread-ava">${escapeHtml(t.ava)}</div>
        <div class="thread-info">
          <div class="thread-title-row">
            ${t.pinned ? '<span class="tag tag-pin">📌</span>' : ''}
            ${t.locked ? '<span class="tag tag-lock">🔒</span>' : ''}
            <span class="thread-title" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</span>
            <span class="tag tag-cat">${escapeHtml(t.cat)}</span>
          </div>
          <div class="thread-meta2"><span data-action="open-profile" data-user="${escapeHtml(t.author)}" style="cursor:pointer;color:var(--text2)">${escapeHtml(t.author)}</span> · ${escapeHtml(t.sub)}</div>
        </div>
      </div>
      <div class="thread-stat">${escapeHtml(String(t.replies))}<small>yanıt</small></div>
      <div class="thread-stat">${escapeHtml(String(t.views))}<small>görüntü</small></div>
      <div class="thread-time-col">${escapeHtml(t.time)}<br><span style="font-size:.67rem">${escapeHtml(t.author)}</span></div>`;
    row.dataset.threadTarget = '/thread/' + (t.slug || t.id);
    el.appendChild(row);
  });
}
