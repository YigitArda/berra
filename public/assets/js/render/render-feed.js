export function renderFeedModule(posts, feedCard) {
  const el = document.getElementById('feedList');
  el.innerHTML = posts.map((p, i) => feedCard(p, i * 0.04)).join('');
}
