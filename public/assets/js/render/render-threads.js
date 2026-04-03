export function renderThreadsModule({ list, escapeHtml, onNavigate }) {
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
            <span class="thread-title">${escapeHtml(t.title)}</span>
            <span class="tag tag-cat">${escapeHtml(t.cat)}</span>
          </div>
          <div class="thread-meta2"><span data-u="${escapeHtml(t.author)}" onclick="openProfile(this.dataset.u)" style="cursor:pointer;color:var(--text2)">${escapeHtml(t.author)}</span> · ${escapeHtml(t.sub)}</div>
        </div>
      </div>
      <div class="thread-stat">${escapeHtml(String(t.replies))}<small>yanıt</small></div>
      <div class="thread-stat">${escapeHtml(String(t.views))}<small>görüntü</small></div>
      <div class="thread-time-col">${escapeHtml(t.time)}<br><span style="font-size:.67rem">${escapeHtml(t.author)}</span></div>`;
    row.addEventListener('click', () => onNavigate('/thread/' + (t.slug || t.id)));
    el.appendChild(row);
  });
}
