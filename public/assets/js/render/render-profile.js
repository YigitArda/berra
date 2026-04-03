export function renderProfileHeaderModule({
  data,
  currentUser,
  escapeHtml,
  avaColor,
  isFollowing,
  isBlocked,
  followingSize,
}) {
  const u = data.user;
  const isMe = currentUser && currentUser.username === u.username;
  const coverColors = ['#e03030', '#2970c7', '#1a9e52', '#c47f00', '#9b59b6', '#e67e22'];
  let ch = 0;
  for (let i = 0; i < u.username.length; i++) ch = (ch * 31 + u.username.charCodeAt(i)) & 0xffffffff;
  const cc = coverColors[Math.abs(ch) % 6];
  const coverEl = document.querySelector('.profile-cover');
  if (coverEl) coverEl.style.background = `linear-gradient(135deg, ${cc}33 0%, #1a1c26 60%)`;
  const coverInner = document.querySelector('.profile-cover-inner');
  if (coverInner) coverInner.style.background = `linear-gradient(90deg, ${cc}2a 0%, transparent 60%)`;
  const avaHtml = u.avatar_url
    ? '<img src="' + u.avatar_url + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'
    : '<span>' + u.username[0].toUpperCase() + '</span>';
  const joinDate = new Date(u.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
  const roleHtml = u.role !== 'user' ? '<span class="profile-role">' + escapeHtml(u.role.toUpperCase()) + '</span>' : '';
  const bioHtml = u.bio
    ? '<div class="profile-bio">' + escapeHtml(u.bio) + '</div>'
    : '<div class="profile-bio-empty">Henüz bio eklenmemiş.</div>';
  const editBioBtn = isMe ? '<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="editBio()">✏ Bio düzenle</button>' : '';
  const avatarEdit = isMe ? '<div class="profile-ava-edit" onclick="triggerAvatarUpload()" title="Fotoğraf değiştir">✎</div><input type="file" id="avatarFileInput" accept="image/*" style="display:none" onchange="uploadAvatar(this)">' : '';
  const followingNow = isFollowing(u.username);
  const blockedNow = isBlocked(u.username);
  const actionRow = !isMe ? `<div class="profile-action-row">
    <button class="follow-btn ${followingNow ? 'following' : ''}" id="followBtn-${escapeHtml(u.username)}"
      onclick="toggleFollow('${escapeHtml(u.username)}',this)">
      ${followingNow ? 'Takip Ediliyor' : 'Takip Et'}
    </button>
    <button class="msg-open-btn" onclick="openMessages('${escapeHtml(u.username)}')">💬 Mesaj</button>
    <div class="post-menu-wrap">
      <button class="post-menu-btn" onclick="togglePostMenu('profile-menu-${escapeHtml(u.username)}')">···</button>
      <div class="post-menu-dropdown" id="profile-menu-${escapeHtml(u.username)}">
        <div class="post-menu-item danger" onclick="toggleBlock('${escapeHtml(u.username)}');closeAllMenus();navigateBack()">
          ${blockedNow ? '✅ Engeli kaldır' : '🚫 Engelle'}
        </div>
      </div>
    </div>
  </div>` : '';

  document.getElementById('profileHeader').innerHTML =
    '<div class="profile-ava-wrap">'
    + '<div class="profile-ava ' + avaColor(u.username) + '" id="profileAvaEl">' + avaHtml + '</div>'
    + avatarEdit
    + '</div>'
    + '<div class="profile-info">'
    + '<div><span class="profile-username">' + escapeHtml(u.username) + '</span>' + roleHtml + '</div>'
    + '<div class="profile-handle">@' + escapeHtml(u.username.toLowerCase()) + ' · 🗓 ' + joinDate + '</div>'
    + '<div id="bioDisplay">' + bioHtml + editBioBtn + '</div>'
    + actionRow
    + '<div class="profile-stats">'
    + '<div><div class="profile-stat-num">' + data.threads.length + '</div><div class="profile-stat-label">Konu</div></div>'
    + '<div><div class="profile-stat-num">' + data.posts.length + '</div><div class="profile-stat-label">Yanıt</div></div>'
    + '<div><div class="profile-stat-num">' + data.cars.length + '</div><div class="profile-stat-label">Araç</div></div>'
    + '<div><div class="profile-stat-num">' + (u.following_count ?? (isMe ? followingSize : 0)) + '</div><div class="profile-stat-label">Takip</div></div>'
    + '<div><div class="profile-stat-num">' + (u.follower_count ?? 0) + '</div><div class="profile-stat-label">Takipçi</div></div>'
    + '</div>'
    + '</div>';
}
