import { getUser, setUserState, clearUserState, getCurrentCat, setCurrentCat } from './state/session.js';
import { getThreads, setThreads, getFeedData, setFeedData } from './state/feed.js';
import { renderThreadsModule } from './render/render-threads.js';
import { renderFeedModule } from './render/render-feed.js';
import { renderProfileHeaderModule } from './render/render-profile.js';
import { navbarEls } from './ui/navbar.js';
import { threadListEl } from './ui/thread-list.js';
import { feedListEl } from './ui/feed-card.js';
import { profileEls } from './ui/profile.js';
import { messageEls } from './ui/messages.js';
import { notificationEls } from './ui/notifications.js';

// ── XSS KORUMASI ───────────────────────────────────────────────
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── STATE ──────────────────────────────────────────────────────
let user = getUser();
let currentCat = getCurrentCat();
let threads = getThreads();
let feedData = getFeedData();

function syncSessionState() {
  setUserState(user);
  setCurrentCat(currentCat);
}

function syncFeedState() {
  setThreads(threads);
  setFeedData(feedData);
}

const STATIC_THREADS = [
  {id:1,ava:'M',author:'Murat_K',cat:'İlk Araba',title:'2019 Corolla mı, Clio mı? Bütçem 750k',sub:'Her ikisini test ettim, farklı deneyimler...',replies:23,views:412,time:'14 dk',pinned:false,locked:false,slug:'ilk',
   posts:[
     {id:1,ava:'M',author:'Murat_K',time:'14 dk',text:'Her ikisini de test ettim. Corolla daha sessiz ve rahat ama Clio sürüş hissi açısından çok daha eğlenceli. Bakım maliyetleri konusunda deneyimi olan var mı?',likes:3,liked:false},
     {id:2,ava:'E',author:'elif_yilmaz',time:'12 dk',text:'Corolla al kesin. Bakım maliyeti çok daha düşük, uzun vadede kazanırsın. Toyota güvenilirliği tartışılmaz.',likes:8,liked:false},
     {id:3,ava:'T',author:'Turbo_Berk',time:'9 dk',text:'Clio aldım 2 yıl önce, hiç pişman olmadım. Şehir içinde çok rahat, park etmesi kolay. Ama dizel alacaksan Corolla daha iyi.',likes:5,liked:false},
   ]},
  {id:2,ava:'A',author:'AdminHasan',cat:'Duyuru',title:'📌 Forum Kuralları — Lütfen okuyun',sub:'Birbirimize saygılı olalım.',replies:0,views:1240,time:'3 gün',pinned:true,locked:true,slug:'all',
   posts:[{id:4,ava:'A',author:'AdminHasan',time:'3 gün',text:'Birbirimize saygılı olalım. İlan yorumu yaparken fotoğraf ekleyin. Spam ve hakaret kesinlikle yasaktır. Kural ihlallerinde hesap askıya alınacaktır.',likes:0,liked:false}]},
  {id:3,ava:'D',author:'dizel_ahmet',cat:'Arıza/Bakım',title:'BMW F30 enjektör temizliği kaç km\'de bir?',sub:'180.000 km\'deyim, servis önerdi...',replies:8,views:189,time:'32 dk',pinned:false,locked:false,slug:'ariza',
   posts:[{id:5,ava:'D',author:'dizel_ahmet',time:'32 dk',text:'180.000 km\'deyim, servis 3. enjektör temizliği önerdi. Fiyat biraz yüksek geldi. Esnafta yaptıranlar memnun mu?',likes:2,liked:false}]},
  {id:4,ava:'T',author:'Turbo_Berk',cat:'Modifiye',title:'Megane 4 RS egzoz sesi — hangi marka?',sub:'Remus mu Akrapovic mi?',replies:41,views:876,time:'1 saat',pinned:false,locked:false,slug:'modifiye',
   posts:[{id:6,ava:'T',author:'Turbo_Berk',time:'1 saat',text:'Orijinal egzoz çok sessiz kaldı. Remus ve Akrapovic arasında kaldım. Türkiye\'de montaj yapan iyi yer de önerin varsa ekleyin.',likes:6,liked:false}]},
  {id:5,ava:'S',author:'sahin_62',cat:'İlan Yorumu',title:'2021 Passat 1.5 TSI — 1.1M alınır mı?',sub:'Hasar kayıtsız, servis bakımlı diyor...',replies:15,views:320,time:'2 saat',pinned:false,locked:false,slug:'ilan',
   posts:[{id:7,ava:'S',author:'sahin_62',time:'2 saat',text:'İlan sahibinden.com\'da. Hasar kayıtsız, servis bakımlı diyor. 68.000 km. Fiyat nasıl, birisi baksın?',likes:1,liked:false}]},
  {id:6,ava:'E',author:'elif_yilmaz',cat:'Genel',title:'Şehir içi en az yakan crossoverlar 2024',sub:'Günde 40 km şehir içi...',replies:19,views:540,time:'3 saat',pinned:false,locked:false,slug:'genel',
   posts:[{id:8,ava:'E',author:'elif_yilmaz',time:'3 saat',text:'Her gün 40 km şehir içi yolculuk yapıyorum. Mokka E ile Duster karşılaştırmasını yapacağım, deneyimi olan var mı?',likes:4,liked:false}]},
  {id:7,ava:'K',author:'kamil_oto',cat:'İlk Araba',title:'Öğrenci bütçesiyle ilk araba — 400k altı',sub:'İkinci el ne bakayım?',replies:34,views:720,time:'5 saat',pinned:false,locked:false,slug:'ilk',
   posts:[{id:9,ava:'K',author:'kamil_oto',time:'5 saat',text:'Üniversite 3. sınıfım, ilk arabamı almak istiyorum. 400k bütçem var, ikinci el ne bakayım?',likes:7,liked:false}]},
];

threads = [...STATIC_THREADS];
feedData = STATIC_THREADS.map(t => ({
  id: t.id,
  slug: t.slug,
  ava: t.ava,
  author: t.author,
  time: t.time || 'önce',
  text: t.title,
  cat: t.cat,
  likes: 0,
  liked: false,
  shares: 0,
  shared: false,
  comments: [],
  comment_count: t.replies || 0,
  views: t.views || 0,
  pinned: t.pinned || false,
  locked: t.locked || false,
}));
syncFeedState();

// UI modüllerini erken bağla
navbarEls(); threadListEl(); feedListEl(); profileEls(); messageEls(); notificationEls();

// ── THREAD RENDER ──────────────────────────────────────────────
function renderThreads(list) {
  renderThreadsModule({
    list,
    escapeHtml,
    onNavigate: navigate,
  });
}

// ── KONU DETAY ────────────────────────────────────────────────
let currentThread = null;

function openThread(id, slug) {
  document.getElementById('threadPage').classList.add('open');
  document.getElementById('threadPage').scrollTop = 0;
  document.getElementById('threadDetailContent').innerHTML =
    '<div style="padding:20px;color:var(--text3)">Yükleniyor...</div>';
  if (!history.state?.path?.startsWith('/thread')) navigate('/thread/' + (slug || id), false);
  // Önce statik listede bak
  const local = slug
    ? STATIC_THREADS.find(x => x.slug === slug) || threads.find(x => x.id === id)
    : threads.find(x => x.id === id);
  if (local && local.slug) {
    loadThreadBySlug(local.slug, local);
  } else if (slug) {
    loadThreadBySlug(slug, null);
  } else {
    loadThreadById(id);
  }
}

async function loadThreadBySlug(slug, localThread) {
  try {
    const data = await apiCall('/api/forum/threads/' + slug + '?page=1', 'GET');
    if (data.error) {
      // DB'de yok, statik göster
      if (localThread) renderThreadDetail(localThread, localThread.posts || []);
      return;
    }
    // DB'den gelen veriyi thread formatına çevir
    const t = {
      id: data.thread.id,
      title: data.thread.title,
      author: localThread?.author || '–',
      cat: localThread?.cat || '–',
      views: data.thread.view_count,
      replies: data.thread.reply_count,
      locked: data.thread.is_locked,
      pinned: data.thread.is_pinned,
      slug: data.thread.slug,
    };
    const posts = data.posts.map(p => ({
      id: p.id,
      ava: p.username ? p.username[0].toUpperCase() : '?',
      author: p.username,
      time: timeAgo(p.created_at),
      text: p.body,
      likes: p.like_count,
      liked: false,
    }));
    currentThread = t;
    renderThreadDetail(t, posts);
    // Statik listedeki thread'i güncelle
    const idx = threads.findIndex(x => x.slug === slug);
    if (idx !== -1) { threads[idx].views = t.views; threads[idx].replies = t.replies; syncFeedState(); }
    renderThreads(getFiltered());
  } catch(e) {
    if (localThread) renderThreadDetail(localThread, localThread.posts || []);
  }
}

async function loadThreadById(id) {
  // ID ile bul - statik listede slug yoksa
  const local = threads.find(x => x.id === id);
  if (local) {
    renderThreadDetail(local, local.posts || []);
  } else {
    document.getElementById('threadDetailContent').innerHTML =
      '<div style="padding:20px;color:var(--accent)">Konu bulunamadı.</div>';
  }
}

function renderThreadDetail(t, posts) {
  currentThread = t;
  const el = document.getElementById('threadDetailContent');
  el.innerHTML =
    '<div class="thread-detail-title">' + escapeHtml(t.title) + '</div>'
    + '<div class="thread-detail-meta">'
    + '<span data-u="' + escapeHtml(t.author) + '" onclick="openProfile(this.dataset.u)" style="cursor:pointer">👤 ' + escapeHtml(t.author) + '</span>'
    + '<span>📂 ' + escapeHtml(t.cat) + '</span>'
    + '<span>👁 ' + escapeHtml(String(t.views)) + ' görüntülenme</span>'
    + '<span>💬 ' + escapeHtml(String(t.replies)) + ' yanıt</span>'
    + (t.locked ? '<span class="tag tag-lock">🔒 Kilitli</span>' : '')
    + '</div>'
    + '<div id="postsList">' + posts.map(p => renderPost(p)).join('') + '</div>'
    + (!t.locked
      ? '<div class="reply-box" id="replyBox">'
        + '<textarea id="replyInput" placeholder="' + (user ? 'Yanıtını yaz...' : 'Yanıtlamak için giriş yap.') + '"></textarea>'
        + '<div class="img-upload-area" id="replyImgArea" style="margin-top:8px">'
        + '<label class="img-upload-btn">📷 Fotoğraf<input type="file" id="replyImgInput" accept="image/*" multiple style="display:none" onchange="addReplyImages(this)"></label>'
        + '</div>'
        + '<div class="reply-box-foot"><button class="btn btn-accent btn-sm" id="btnReply">Yanıtla</button></div>'
        + '</div>'
      : '');

  if (!t.locked) {
    setTimeout(() => {
      const replyBtn = document.getElementById('btnReply');
      if (replyBtn) {
        replyBtn.onclick = async () => {
          const txt = document.getElementById('replyInput').value.trim();
          if (!txt) return;
          if (!user) { showToast('Yanıtlamak için giriş yap.', 'err'); return; }
          replyBtn.innerHTML = '<span class="spinner"></span>';
          try {
            const slug = t.slug || '';
            let posted = false;
            if (slug) {
              const data = await apiCall('/api/forum/threads/' + slug + '/posts', 'POST', { body: txt, images: replyImages });
              if (!data.error) posted = true;
            }
            const newPost = {
              id: Date.now(), ava: user.ava, author: user.username,
              time: 'Az önce', text: txt, likes: 0, liked: false,
              images: [...replyImages]
            };
            replyImages = [];
            document.getElementById('postsList').innerHTML += renderPost(newPost);
            document.getElementById('replyInput').value = '';
            replyBtn.textContent = 'Yanıtla';
            // Sayacı güncelle
            t.replies++;
            const localT = threads.find(x => x.id === t.id || x.slug === t.slug);
            if (localT) { localT.replies = t.replies; syncFeedState(); }
            renderThreads(getFiltered());
            showToast(posted ? 'Yanıtın kaydedildi!' : 'Yanıtın eklendi!', 'ok');
          } catch(e) {
            replyBtn.textContent = 'Yanıtla';
            showToast('Hata oluştu.', 'err');
          }
        };
      }
    }, 50);
  }
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'Az önce';
  if (diff < 3600) return Math.floor(diff/60) + ' dk';
  if (diff < 86400) return Math.floor(diff/3600) + ' saat';
  return Math.floor(diff/86400) + ' gün';
}

function renderPost(p) {
  const imgsHtml = p.images && p.images.length
    ? '<div class="post-images">' + p.images.map(img => `<img class="post-img" src="${img}" onclick="openImg('${img}')">`).join('') + '</div>'
    : '';
  const prevHtml = p.preview
    ? `<a href="${p.preview.url}" target="_blank" style="text-decoration:none">
        <div class="preview-card">
          ${p.preview.image ? `<img class="preview-img" src="${p.preview.image}" onerror="this.style.display='none'">` : ''}
          <div class="preview-body">
            <div class="preview-site">${p.preview.site}</div>
            <div class="preview-title">${p.preview.title || ''}</div>
            ${p.preview.price ? `<div class="preview-price">${p.preview.price}</div>` : ''}
            <div class="preview-desc">${p.preview.description || ''}</div>
          </div>
        </div>
      </a>` : '';
  return `<div class="post-item">
    <div class="post-ava">${escapeHtml(p.ava)}</div>
    <div class="post-body">
      <span class="post-author" onclick="openProfile('${escapeHtml(p.author)}')" style="cursor:pointer">${escapeHtml(p.author)}</span>
      <span class="post-time">${escapeHtml(p.time)}</span>
      <div class="post-text">${escapeHtml(p.text)}</div>
      ${imgsHtml}${prevHtml}
      <div class="post-actions">
        <button class="post-like-btn ${p.liked?'liked':''}" onclick="likePost(${p.id},this)">♥ ${escapeHtml(String(p.likes))}</button>
        <button class="post-like-btn" style="margin-left:auto;opacity:.55" onclick="openReport('post',${p.id})">🚨 Şikayet</button>
      </div>
    </div>
  </div>`;
}

async function likePost(id, btn) {
  for (const t of threads) {
    const p = t.posts?.find(x => x.id === id);
    if (p) {
      await runOptimisticInteraction({
        item: p,
        applyOptimistic: () => {
          p.liked = !p.liked;
          p.likes += p.liked ? 1 : -1;
        },
        onUiUpdate: ({ item }) => {
          btn.textContent = '♥ ' + item.likes;
          btn.classList.toggle('liked', item.liked);
        },
        request: async () => {
          if (id >= 1000000000000) return;
          const method = p.liked ? 'POST' : 'DELETE';
          const data = await apiCall('/api/forum/posts/' + id + '/like', method);
          if (data.like_count !== undefined) {
            p.likes = data.like_count;
            syncFeedState();
            btn.textContent = '♥ ' + p.likes;
          }
        },
        errorKey: 'likePost',
        errorMessage: 'Beğeni işlemi başarısız.',
      });
      return;
    }
  }
}

document.getElementById('btnBack').addEventListener('click', () => navigateBack());
document.getElementById('profilePage').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

// ── KATEGORİ FİLTRE ───────────────────────────────────────────
const catMap = { genel:'genel', ilk:'ilk', modifiye:'modifiye', ilan:'ilan', ariza:'ariza' };
function getFiltered() {
  if (currentCat === 'all') return threads;
  return threads.filter(t => t.slug === currentCat);
}
document.querySelectorAll('.cat-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCat = tab.dataset.cat;
    syncSessionState();
    renderThreads(getFiltered());
  });
});

// ── YARDIMCI: avatar renk ──────────────────────────────────────
function avaColor(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return 'ava-c' + Math.abs(h) % 6;
}
// Metinden otomatik etiket çıkar
const TAG_MAP = {BMW:'BMW',Mercedes:'Mercedes',Audi:'Audi',Toyota:'Toyota',Corolla:'Corolla',Clio:'Clio',Passat:'Passat',Golf:'Golf',Togg:'Togg',LPG:'LPG',dizel:'Dizel',benzin:'Benzin',modifiye:'Modifiye',egzoz:'Egzoz',bakım:'Bakım',kaza:'Kaza',sigorta:'Sigorta',fiyat:'Fiyat'};
function extractTags(text) {
  return Object.entries(TAG_MAP).filter(([k]) => text.toLowerCase().includes(k.toLowerCase())).slice(0,4).map(([,v]) => v);
}

// ── FEED RENDER ───────────────────────────────────────────────
function feedCommentHtml(c, postId, isReply) {
  const repliesHtml = (!isReply && c.replies && c.replies.length)
    ? c.replies.map(r => feedCommentHtml(r, postId, true)).join('')
    : '';
  return `<div class="feed-comment${isReply?' is-reply':''}">
    <div class="feed-comment-ava ${avaColor(c.author)}">${escapeHtml(c.ava)}</div>
    <div class="feed-comment-body" style="flex:1;min-width:0">
      <span class="feed-comment-author">${escapeHtml(c.author)}</span>
      <span class="feed-comment-time">${escapeHtml(c.time)}</span>
      <div class="feed-comment-text">${escapeHtml(c.text)}</div>
      ${!isReply ? `<div class="comment-action-row">
        <button class="comment-reply-btn" onclick="event.stopPropagation();toggleCommentReply(${postId},${c.id})">↩ Yanıtla</button>
        <button class="comment-reply-btn" style="opacity:.55" onclick="event.stopPropagation();openReport('feed_comment',${c.id})">🚨 Şikayet</button>
      </div>
      <div class="comment-reply-form" id="cr-${postId}-${c.id}">
        <div class="feed-comment-ava ${user?avaColor(user.username):''}">
          ${user?escapeHtml(user.ava||user.username[0].toUpperCase()):'👤'}
        </div>
        <textarea class="comment-reply-input" id="cri-${postId}-${c.id}" rows="1"
          placeholder="Yanıtla..." onkeydown="replyKeydown(event,${postId},${c.id})"></textarea>
        <button class="comment-reply-send" onclick="submitReply(${postId},${c.id})">➤</button>
      </div>
      <div class="comment-replies" id="crp-${postId}-${c.id}">${repliesHtml}</div>` : ''}
    </div>
  </div>`;
}

function feedCard(p, delay) {
  if (isBlocked(p.author)) return '';
  const isPinned = !!p.pinned;
  const isLocked = !!p.locked;
  const cardClass = isPinned ? ' is-announce' : '';
  const badge = isPinned ? '<div class="feed-item-badge badge-trend">📌 Sabit Konu</div>' : '';
  const menuId = 'pm-' + p.id;
  return `<div class="feed-item${cardClass}" id="fi-${p.id}" style="animation-delay:${delay}s" onclick="openFeedPost(event,${p.id})">
    <div class="feed-item-top">
      <div class="feed-ava ${avaColor(p.author)}">${escapeHtml(p.ava)}</div>
      <div class="feed-meta">
        <span class="feed-author" onclick="event.stopPropagation();navigate('/profile/${escapeHtml(p.author)}')">${escapeHtml(p.author)}</span>
        <span class="feed-time">${escapeHtml(p.time)}</span>
      </div>
      <div class="post-menu-wrap" onclick="event.stopPropagation()">
        <button class="post-menu-btn" onclick="togglePostMenu('${menuId}')">···</button>
        <div class="post-menu-dropdown" id="${menuId}">
          <div class="post-menu-item" onclick="navigate('/profile/${escapeHtml(p.author)}');closeAllMenus()">👤 Profili gör</div>
          <div class="post-menu-item" onclick="openMessages('${escapeHtml(p.author)}');closeAllMenus()">💬 Mesaj gönder</div>
          <div class="post-menu-item danger" onclick="blockAndRefresh('${escapeHtml(p.author)}');closeAllMenus()">🚫 Engelle</div>
          <div class="post-menu-item danger" onclick="openReport('feed_post',${p.id});closeAllMenus()">🚨 Şikayet et</div>
        </div>
      </div>
    </div>
    ${badge}
    <div class="feed-text">${escapeHtml(p.text)}</div>
    <div class="feed-tag-row">
      ${p.cat ? `<span class="feed-auto-tag">#${escapeHtml(p.cat)}</span>` : ''}
      ${isLocked ? '<span class="feed-auto-tag">#kilitli</span>' : ''}
      ${p.views != null ? `<span class="feed-auto-tag">👁 ${escapeHtml(String(p.views))}</span>` : ''}
    </div>
    <div class="feed-actions" onclick="event.stopPropagation()">
      <button class="feed-btn" onclick="event.stopPropagation();openThreadFromFeed(${p.id})">💬 <span>${p.comment_count || 0}</span></button>
      <button class="feed-btn ${p.shared?'shared':''}" onclick="shareFeed(${p.id},this)">🔗 <span>${p.shares}</span></button>
    </div>
  </div>`;
}

function renderFeed(posts) {
  renderFeedModule(posts, feedCard);
}

function openFeedPost(e, id) {
  if (e.target.closest('.feed-actions') || e.target.closest('.feed-author') || e.target.closest('.post-menu-wrap')) return;
  const p = feedData.find(x => x.id === id);
  navigate('/thread/' + (p?.slug || id));
}

function openThreadFromFeed(id) {
  const p = feedData.find(x => x.id === id);
  navigate('/thread/' + (p?.slug || id));
}

function toggleComments(id, btn, forceOpen) {
  const panel = document.getElementById('fc-' + id);
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (forceOpen && isOpen) return;
  if (isOpen) {
    panel.classList.remove('open');
  } else {
    panel.classList.add('open');
    setTimeout(() => document.getElementById('fci-' + id)?.focus(), 310);
  }
}

function shareFeed(id, btn) {
  const p = feedData.find(x => x.id === id);
  if (!p) return;
  if (!p.shared) {
    p.shared = true;
    p.shares++;
    btn.classList.add('shared');
    btn.querySelector('span').textContent = p.shares;
  }
  const url = window.location.origin + '/thread/' + (p.slug || id);
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast('Bağlantı kopyalandı!','ok'));
  else showToast('Paylaşıldı!','ok');
}

const rollbackToastLocks = new Set();
function showRollbackErrorOnce(key, msg) {
  if (rollbackToastLocks.has(key)) return;
  rollbackToastLocks.add(key);
  showToast(msg, 'err');
  setTimeout(() => rollbackToastLocks.delete(key), 2000);
}

function cloneForRollback(v) {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}

function createInteractionSnapshot(item) {
  return {
    likes: item?.likes,
    liked: item?.liked,
    comment_count: item?.comment_count,
    comments: Array.isArray(item?.comments) ? cloneForRollback(item.comments) : undefined,
  };
}

async function runOptimisticInteraction({ item, applyOptimistic, request, onUiUpdate, errorKey, errorMessage }) {
  const snapshot = createInteractionSnapshot(item);
  applyOptimistic();
  syncFeedState();
  if (onUiUpdate) onUiUpdate({ item, snapshot, rolledBack: false });
  try {
    if (request) await request();
    return true;
  } catch (e) {
    if (item) {
      if (snapshot.likes !== undefined) item.likes = snapshot.likes;
      if (snapshot.liked !== undefined) item.liked = snapshot.liked;
      if (snapshot.comment_count !== undefined) item.comment_count = snapshot.comment_count;
      if (snapshot.comments !== undefined) item.comments = cloneForRollback(snapshot.comments);
    }
    syncFeedState();
    if (onUiUpdate) onUiUpdate({ item, snapshot, rolledBack: true, error: e });
    showRollbackErrorOnce(errorKey, errorMessage);
    return false;
  }
}

async function submitComment(id) {
  const inp = document.getElementById('fci-' + id);
  const txt = inp.value.trim();
  if (!txt) return;
  if (!user) { showToast('Yorum yapmak için giriş yap.', 'err'); return; }
  const p = feedData.find(x => x.id === id);
  if (!p) return;
  const sendBtn = inp?.parentElement?.querySelector('.feed-comment-send');
  btnLoading(sendBtn, true);
  const newComment = {
    id: Date.now(),
    ava: user.ava || user.username[0].toUpperCase(),
    author: user.username,
    time: 'Az önce',
    text: txt,
    replies: [],
  };
  await runOptimisticInteraction({
    item: p,
    applyOptimistic: () => {
      p.comments.push(newComment);
      p.comment_count = (p.comment_count || 0) + 1;
    },
    onUiUpdate: ({ item, rolledBack }) => {
      const list = document.getElementById('fcl-' + id);
      if (list) list.innerHTML = item.comments.map(c => feedCommentHtml(c, id, false)).join('');
      const card = document.getElementById('fi-' + id);
      const commentBtn = card?.querySelector('.feed-actions .feed-btn:nth-child(2) span');
      if (commentBtn) commentBtn.textContent = item.comment_count || 0;
      if (!rolledBack) {
        inp.value = '';
        if (inp) autoResize(inp);
        list?.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});
      } else {
        inp.value = txt;
        if (inp) autoResize(inp);
      }
    },
    request: async () => {
      await apiCall('/api/feed/' + id + '/comment', 'POST', { text: txt });
    },
    errorKey: 'submitComment',
    errorMessage: 'Yorum gönderilemedi.',
  });
  btnLoading(sendBtn, false);
}

function commentKeydown(e, id) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(id); }
}

async function likeFeed(id, btn) {
  if (!user) { showToast('Beğenmek için giriş yap.', 'err'); return; }
  const p = feedData.find(x => x.id === id);
  if (!p) return;
  await runOptimisticInteraction({
    item: p,
    applyOptimistic: () => {
      p.liked = !p.liked;
      p.likes += p.liked ? 1 : -1;
    },
    onUiUpdate: ({ item, rolledBack }) => {
      const likeCountEl = btn?.querySelector('span');
      if (likeCountEl) likeCountEl.textContent = item.likes;
      btn.classList.toggle('liked', item.liked);
      if (!rolledBack && item.liked) {
        btn.classList.add('heart-anim');
        setTimeout(() => btn.classList.remove('heart-anim'), 400);
      }
    },
    request: async () => {
      if (id >= 1000000000000) return;
      const method = p.liked ? 'POST' : 'DELETE';
      await apiCall('/api/feed/' + id + '/like', method);
    },
    errorKey: 'likeFeed',
    errorMessage: 'Beğeni işlemi başarısız.',
  });
}

document.getElementById('feedInput').addEventListener('input', function() {
  document.getElementById('charCount').textContent = this.value.length + '/200';
});
document.getElementById('btnPost').addEventListener('click', () => {
  if (!user) { showToast('Konu açmak için giriş yap.', 'err'); return; }
  const title = document.getElementById('feedInput').value.trim();
  openModal('newThreadModal');
  if (title) {
    const ntTitle = document.getElementById('nt_title');
    if (ntTitle) ntTitle.value = title;
  }
});

// ── AUTH ──────────────────────────────────────────────────────
function setUser(u) {
  user = u;
  syncSessionState();
  const avaClass = avaColor(u.username);
  const unreadCount = notifData.filter(n => !n.read).length;
  const msgCount = Object.values(conversations).reduce((a,msgs) => a + msgs.filter(m => !m.read && m.from !== u.username).length, 0);
  document.getElementById('navRight').innerHTML = `
    <button class="nav-msg-btn" title="Mesajlar" onclick="navigate('/messages')">
      💬${msgCount > 0 ? `<span class="msg-badge">${msgCount}</span>` : ''}
    </button>
    <button class="nav-notif-btn" title="Bildirimler" onclick="openNotifPanel()">
      🔔${unreadCount > 0 ? `<span class="notif-badge">${unreadCount}</span>` : ''}
    </button>
    <div class="nav-user-chip" onclick="navigate('/profile/${escapeHtml(u.username)}')">
      <div class="nav-user-ava ${avaClass}">${escapeHtml(u.ava || u.username[0].toUpperCase())}</div>
      <span class="nav-user-name">${escapeHtml(u.username)}</span>
    </div>
    <button class="btn btn-ghost btn-sm" onclick="doLogout()">Çıkış</button>`;
  const ca2 = document.getElementById('composeAva');
  if (ca2) { ca2.textContent = u.ava || u.username[0].toUpperCase(); ca2.className = 'compose-ava ' + avaClass; }
  setTimeout(renderNavBadges, 0); // async olarak çalıştır
  if (!window._tokenRefreshInterval) {
    window._tokenRefreshInterval = setInterval(async () => {
      try { await apiCall('/api/auth/refresh', 'POST'); } catch(e) {}
    }, 6 * 60 * 60 * 1000);
  }
}
function doLogout() {
  user = null;
  clearUserState();
  syncSessionState();
  // Token yenileme interval'ini temizle
  if (window._tokenRefreshInterval) {
    clearInterval(window._tokenRefreshInterval);
    window._tokenRefreshInterval = null;
  }
  document.getElementById('navRight').innerHTML = `
    <button class="btn btn-ghost" id="btnLogin">Giriş Yap</button>
    <button class="btn btn-accent" id="btnRegBtn">Kayıt Ol</button>`;
  document.getElementById('btnLogin').onclick = () => openModal('authModal');
  document.getElementById('btnRegBtn').onclick = () => { openModal('authModal'); switchAuth('register'); };
  const ca = document.getElementById('composeAva');
  if (ca) { ca.textContent = '👤'; ca.className = 'compose-ava'; }
  showToast('Çıkış yapıldı.', 'ok');
}

async function apiCall(url, method, body) {
  try {
    const res = await fetch(url, {
      method: method || 'GET', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) {
      showToast('Oturumun sona erdi, tekrar giriş yap.', 'err');
    }
    return res.json();
  } catch(e) {
    showToast('Bağlantı hatası. İnternet bağlantını kontrol et.', 'err');
    throw e;
  }
}

document.getElementById('doLogin').addEventListener('click', async () => {
  const email = document.getElementById('l_email').value.trim();
  const pass  = document.getElementById('l_pass').value;
  const errEl = document.getElementById('loginErr');
  if (!email || !pass) { showErr(errEl, 'Email ve şifre gerekli.'); return; }
  const btn = document.getElementById('doLogin');
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    const data = await apiCall('/api/auth/login', 'POST', { email, password: pass });
    if (data.error) { showErr(errEl, data.error); btn.textContent = 'Giriş Yap'; return; }
    setUser({ username: data.user.username, ava: data.user.username[0].toUpperCase(), role: data.user.role });
    closeModal('authModal');
    showToast('Hoş geldin, ' + data.user.username + '!', 'ok');
  } catch(e) { showErr(errEl, 'Bağlantı hatası.'); btn.textContent = 'Giriş Yap'; }
});

document.getElementById('doReg').addEventListener('click', async () => {
  const username = document.getElementById('r_user').value.trim();
  const email    = document.getElementById('r_email').value.trim();
  const pass     = document.getElementById('r_pass').value;
  const errEl    = document.getElementById('regErr');
  if (!username || !email || !pass) { showErr(errEl, 'Tüm alanları doldur.'); return; }
  if (pass.length < 6) { showErr(errEl, 'Şifre en az 6 karakter olmalı.'); return; }
  const btn = document.getElementById('doReg');
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    const data = await apiCall('/api/auth/register', 'POST', { username, email, password: pass });
    if (data.error) { showErr(errEl, data.error); btn.textContent = 'Kayıt Ol'; return; }
    if (data.errors) { showErr(errEl, data.errors[0].msg); btn.textContent = 'Kayıt Ol'; return; }
    setUser({ username: data.user.username, ava: data.user.username[0].toUpperCase(), role: data.user.role });
    closeModal('authModal');
    showToast('Kayıt başarılı! Hoş geldin, ' + data.user.username + '!', 'ok');
  } catch(e) { showErr(errEl, 'Bağlantı hatası.'); btn.textContent = 'Kayıt Ol'; }
});

// ── YENİ KONU ────────────────────────────────────────────────
document.getElementById('btnNewThread').addEventListener('click', () => {
  if (!user) { openModal('authModal'); showToast('Konu açmak için giriş yap.', 'err'); return; }
  openModal('newThreadModal');
});

document.getElementById('doNewThread').addEventListener('click', async () => {
  const title = document.getElementById('nt_title').value.trim();
  const body  = document.getElementById('nt_body').value.trim();
  const cat   = document.getElementById('nt_cat').value;
  const errEl = document.getElementById('ntErr');
  if (!title || !body) { showErr(errEl, 'Başlık ve içerik zorunlu.'); return; }
  if (title.length < 5) { showErr(errEl, 'Başlık en az 5 karakter olmalı.'); return; }

  const btn = document.getElementById('doNewThread');
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const data = await apiCall('/api/forum/threads', 'POST', { title, body, category_id: parseInt(cat) });
    if (data.error || data.errors) {
      showErr(errEl, data.error || data.errors[0].msg);
      btn.textContent = 'Konuyu Yayınla'; return;
    }
    // Listeye ekle (optimistic)
    const catNames = { 1:'Genel', 2:'İlk Araba', 3:'Modifiye', 4:'İlan Yorumu', 5:'Arıza/Bakım' };
    const newThread = {
      id: Date.now(), ava: user.ava, author: user.username,
      cat: catNames[cat], title, sub: body.substring(0, 60) + '...',
      replies: 0, views: 0, time: 'Az önce',
      pinned: false, locked: false, slug: ['','genel','ilk','modifiye','ilan','ariza'][cat],
      posts: [{ id: Date.now(), ava: user.ava, author: user.username, time: 'Az önce', text: body, likes: 0, liked: false, images: [...ntImages], preview: currentPreview }]
    };
    threads.unshift(newThread);
    syncFeedState();
    renderThreads(getFiltered());
    feedData.unshift({
      id: newThread.id,
      slug: newThread.slug,
      ava: newThread.ava,
      author: newThread.author,
      time: 'Az önce',
      text: newThread.title,
      cat: newThread.cat,
      likes: 0,
      liked: false,
      shares: 0,
      shared: false,
      comments: [],
      comment_count: 0,
      views: 0,
      pinned: false,
      locked: false
    });
    renderFeed(feedData);
    document.getElementById('feedInput').value = '';
    document.getElementById('charCount').textContent = '0/200';
    closeModal('newThreadModal');
    document.getElementById('nt_title').value = '';
    document.getElementById('nt_body').value = '';
    document.getElementById('nt_link').value = '';
    document.getElementById('previewCard').innerHTML = '';
    ntImages = []; currentPreview = null;
    renderNtImages();
    btn.textContent = 'Konuyu Yayınla';
    showToast('Konu yayınlandı!', 'ok');
    // Eğer API'den slug döndüyse o konuyu aç
    if (data.slug) {
      newThread.slug = data.slug;
      loadThreadBySlug(data.slug, newThread);
      document.getElementById('threadPage').classList.add('open');
    } else {
      openThread(newThread.id, newThread.slug || '');
    }
  } catch(e) { showErr(errEl, 'Bağlantı hatası.'); btn.textContent = 'Konuyu Yayınla'; }
});

// ── SKOR ─────────────────────────────────────────────────────
const BRANDS = {toyota:2.0,honda:2.0,mazda:1.8,subaru:1.7,volkswagen:1.5,vw:1.5,skoda:1.5,hyundai:1.6,kia:1.6,renault:1.3,peugeot:1.2,citroen:1.2,fiat:1.1,dacia:1.4,ford:1.4,opel:1.3,bmw:1.4,mercedes:1.4,audi:1.3,nissan:1.5,suzuki:1.7};
const YN = new Date().getFullYear();

document.getElementById('btnCalc').addEventListener('click', () => {
  const brand = document.getElementById('sc_brand').value.trim();
  const year  = parseInt(document.getElementById('sc_year').value);
  const km    = parseInt(document.getElementById('sc_km').value);
  const price = parseFloat(document.getElementById('sc_price').value);
  if (!brand || !year || isNaN(km) || isNaN(price)) { showToast('Tüm alanları doldur.', 'err'); return; }
  const age = YN - year;
  const yas = age<=2?3:age<=5?2.5:age<=8?2:age<=12?1.3:age<=18?0.7:0.2;
  const kms = km<=30000?3:km<=60000?2.5:km<=100000?1.8:km<=150000?1:km<=200000?0.5:0.1;
  const base = 1500000 * Math.pow(0.88, age) * Math.max(0.6, 1-km/800000);
  const fiy = (r => r<=0.75?2:r<=0.95?1.6:r<=1.1?1.2:r<=1.3?0.7:0.2)(price/base);
  const mar = BRANDS[brand.toLowerCase()] ?? 1.2;
  const tot = parseFloat((yas+kms+fiy+mar).toFixed(2));
  const v = tot>=7.5?'alinir':tot>=5?'dusun':'alinmaz';
  const vM = {alinir:['✓ ALINIR','c-green','Fiyat/değer dengesi iyi.'],dusun:['~ DÜŞÜN','c-amber','Araştırın, test edin.'],alinmaz:['✗ ALINMAZ','c-red','Bu fiyata değmez.']};
  const n = document.getElementById('scoreNum');
  n.textContent = tot; n.className = 'score-big ' + vM[v][1];
  document.getElementById('scoreVerdict').textContent = vM[v][0];
  document.getElementById('scoreVerdict').className = 'score-verdict ' + vM[v][1];
  document.getElementById('scoreSub').textContent = vM[v][2];
  const sb = (id,val,max) => { document.getElementById('b_'+id).style.width=(val/max*100)+'%'; document.getElementById('v_'+id).textContent=val; };
  sb('yas',yas,3); sb('km',kms,3); sb('fiyat',fiy,2); sb('marka',mar,2);
  document.getElementById('scoreResult').classList.add('show');
});

// ── MODAL YARDIMCILARI ────────────────────────────────────────
const openModal  = id => document.getElementById(id).classList.add('open');
const closeModal = id => document.getElementById(id).classList.remove('open');
function showErr(el, msg) { el.textContent = msg; el.classList.add('show'); }

document.getElementById('btnScore').onclick      = () => openModal('scoreModal');
document.getElementById('closeScore').onclick    = () => closeModal('scoreModal');
document.getElementById('btnLogin').onclick      = () => openModal('authModal');
document.getElementById('btnRegBtn').onclick     = () => { openModal('authModal'); switchAuth('register'); };
document.getElementById('closeAuth').onclick     = () => closeModal('authModal');
document.getElementById('closeNewThread').onclick = () => closeModal('newThreadModal');

document.querySelectorAll('.overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});
document.querySelectorAll('.fg input, .fg textarea').forEach(el => {
  el.addEventListener('input', () => {
    const err = el.closest('.a-form, div')?.querySelector('.auth-error');
    if (err) err.classList.remove('show');
  });
});

function switchAuth(tab) {
  document.querySelectorAll('.a-tab').forEach(t => t.classList.toggle('active', t.dataset.t === tab));
  document.getElementById('loginF').classList.toggle('show', tab === 'login');
  document.getElementById('regF').classList.toggle('show', tab === 'register');
  document.getElementById('forgotF').classList.toggle('show', tab === 'forgot');
}
document.querySelectorAll('.a-tab').forEach(t => t.onclick = () => switchAuth(t.dataset.t));

// Şifremi unuttum
document.getElementById('doForgot').addEventListener('click', async () => {
  const email = document.getElementById('f_email').value.trim();
  const errEl = document.getElementById('forgotErr');
  if (!email) { showErr(errEl, 'Email gerekli.'); return; }
  const data = await apiCall('/api/auth/forgot-password', 'POST', { email });
  if (data.error) { showErr(errEl, data.error); return; }
  document.getElementById('resetForm').style.display = 'block';
  if (data.resetToken) document.getElementById('f_token').value = data.resetToken; // Dev mode
  showToast('Sıfırlama kodu oluşturuldu.', 'ok');
});
document.getElementById('doReset').addEventListener('click', async () => {
  const token = document.getElementById('f_token').value.trim();
  const password = document.getElementById('f_newpass').value;
  const errEl = document.getElementById('forgotErr');
  if (!token || !password) { showErr(errEl, 'Kod ve yeni şifre gerekli.'); return; }
  if (password.length < 6) { showErr(errEl, 'Şifre en az 6 karakter olmalı.'); return; }
  const data = await apiCall('/api/auth/reset-password', 'POST', { token, password });
  if (data.error) { showErr(errEl, data.error); return; }
  showToast('Şifre değiştirildi!', 'ok');
  closeModal('authModal');
  // Otomatik giriş
  const me = await apiCall('/api/auth/me', 'GET');
  if (me.user) { me.user.ava = me.user.username[0].toUpperCase(); setUser(me.user); }
});

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2800);
}




// ── TEMA ─────────────────────────────────────────────────────
function toggleTheme() {
  const isDark = !document.body.classList.contains('light');
  document.body.classList.toggle('light', isDark);
  document.documentElement.classList.toggle('light', isDark);
  document.getElementById('themeToggle').classList.toggle('dark', !isDark);
  document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}
// Sayfa açılışında tema yükle
(function() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    document.documentElement.classList.add('light');
    document.getElementById('themeIcon').textContent = '☀️';
  } else {
    document.getElementById('themeToggle').classList.add('dark');
  }
})();

// ── ANA SAYFA ────────────────────────────────────────────────
function goHome(noNav) {
  ['threadPage','profilePage','postDetailPage','messagesPage'].forEach(id => {
    document.getElementById(id)?.classList.remove('open');
  });
  if (!noNav) navigate('/', true);
}

// ── PROFİL ────────────────────────────────────────────────────
let profileData = null;
let profileTab  = 'threads';

function openProfile(username) {
  if (!username) return;
  navigate('/profile/' + username);
}

async function loadProfile(username) {
  try {
    const data = await apiCall('/api/profile/' + username, 'GET');
    if (data.error) {
      // Kullanıcı DB'de yok — sahte verilerden göster
      const fakeUser = STATIC_THREADS.find(t => t.author === username);
      if (fakeUser) {
        profileData = {
          user: { id: 0, username, bio: null, avatar_url: null, role: 'user', created_at: new Date().toISOString() },
          threads: STATIC_THREADS.filter(t => t.author === username).map(t => ({
            id: t.id, title: t.title, slug: t.slug || '', reply_count: t.replies, view_count: t.views,
            created_at: new Date().toISOString(), category_name: t.cat
          })),
          posts: [],
          cars: []
        };
        renderProfileHeader(profileData);
        renderProfileTabs();
        renderProfileTab('threads');
      } else {
        document.getElementById('profileHeader').innerHTML = '<div style="padding:20px;color:var(--accent)">Kullanıcı bulunamadı.</div>';
      }
      return;
    }
    profileData = data;
    renderProfileHeader(data);
    renderProfileTabs();
    renderProfileTab('threads');
  } catch(e) {
    console.error('loadProfile error:', e);
    document.getElementById('profileHeader').innerHTML = '<div style="padding:20px;color:var(--accent)">Bağlantı hatası.</div>';
  }
}

function renderProfileHeader(data) {
  renderProfileHeaderModule({
    data,
    currentUser: user,
    escapeHtml,
    avaColor,
    isFollowing,
    isBlocked,
    followingSize: following.size,
  });
}

function renderProfileTabs() {
  const isMe = user && profileData && user.username === profileData.user.username;
  document.getElementById('profileTabsEl').innerHTML = `
    <div class="profile-tab active" data-pt="threads" onclick="renderProfileTab('threads')">Konular</div>
    <div class="profile-tab" data-pt="posts" onclick="renderProfileTab('posts')">Yanıtlar</div>
    <div class="profile-tab" data-pt="cars" onclick="renderProfileTab('cars')">Araçları</div>`;
}

function renderProfileTab(tab) {
  profileTab = tab;
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.toggle('active', t.dataset.pt === tab));
  const c = document.getElementById('profileContent');
  if (!profileData) return;

  if (tab === 'threads') {
    if (!profileData.threads.length) { c.innerHTML = '<div style="color:var(--text3);padding:20px 0">Henüz konu açmamış.</div>'; return; }
    c.innerHTML = '<div class="profile-section-title">Açılan Konular</div>' +
      profileData.threads.map(t => `
        <div class="profile-thread-item" onclick="navigate('/thread/' + (${JSON.stringify(t.slug||'')} || ${t.id}))">
          <div class="profile-thread-title">${escapeHtml(t.title)}</div>
          <div class="profile-thread-meta">
            <span>📂 ${escapeHtml(t.category_name)}</span>
            <span>💬 ${escapeHtml(String(t.reply_count))} yanıt</span>
            <span>👁 ${escapeHtml(String(t.view_count))} görüntü</span>
          </div>
        </div>`).join('');
  }

  if (tab === 'posts') {
    if (!profileData.posts.length) { c.innerHTML = '<div style="color:var(--text3);padding:20px 0">Henüz yanıt yazmamış.</div>'; return; }
    c.innerHTML = '<div class="profile-section-title">Yazılan Yanıtlar</div>' +
      profileData.posts.map(p => `
        <div class="profile-post-item">
          <div class="profile-post-thread">↩ ${escapeHtml(p.thread_title)}</div>
          <div class="profile-post-body">${escapeHtml(p.body.substring(0,200))}${p.body.length>200?'...':''}</div>
          <div class="profile-post-meta">♥ ${escapeHtml(String(p.like_count))} beğeni</div>
        </div>`).join('');
  }

  if (tab === 'cars') {
    const isMe = user && profileData && user.username === profileData.user.username;
    const carsHtml = profileData.cars.length
      ? '<div class="car-grid">' + profileData.cars.map(car => `
          <div class="car-card ${car.is_current?'current':''}">
            ${isMe ? `<button class="car-delete" onclick="deleteCar(${car.id})">✕</button>` : ''}
            <div class="car-brand">${escapeHtml(car.brand)} ${car.is_current?'<span class="car-badge">Güncel</span>':''}</div>
            <div class="car-model">${escapeHtml(car.model)}</div>
            <div class="car-year">${escapeHtml(String(car.year))}${car.owned_from?' · '+escapeHtml(String(car.owned_from))+'-'+(car.owned_to?escapeHtml(String(car.owned_to)):'hâlâ'):''}</div>
            ${car.notes?`<div class="car-notes">"${escapeHtml(car.notes)}"</div>`:''}
          </div>`).join('') + '</div>'
      : '<div style="color:var(--text3);padding:20px 0 12px">Henüz araç eklenmemiş.</div>';

    c.innerHTML = '<div class="profile-section-title">Arabalar</div>' + carsHtml +
      (isMe ? '<button class="btn btn-ghost btn-sm" id="btnAddCarInline">+ Araç Ekle</button>' : '');
  }
}

// Avatar yükle
function triggerAvatarUpload() { document.getElementById('avatarFileInput').click(); }
async function uploadAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 300000) { showToast('Resim max 300KB olmalı.', 'err'); return; }
  // Resmi 200x200'e küçült
  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 200;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const reader = new FileReader();
  reader.onload = e => {
    img.onload = async () => {
      const size = Math.min(img.width, img.height);
      const ox = (img.width - size) / 2;
      const oy = (img.height - size) / 2;
      ctx.drawImage(img, ox, oy, size, size, 0, 0, 200, 200);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      const data = await apiCall('/api/profile/me/avatar', 'PUT', { avatar_url: base64 });
      if (data.error) { showToast(data.error, 'err'); return; }
      const avaEl = document.getElementById('profileAvaEl');
      if (avaEl) avaEl.innerHTML = '<img src="' + base64 + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
      if (user) { user.avatar_url = base64; }
      if (profileData) profileData.user.avatar_url = base64;
      showToast('Avatar güncellendi!', 'ok');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Bio düzenle
function editBio() {
  const bio = profileData?.user?.bio || '';
  document.getElementById('bioDisplay').innerHTML = `
    <textarea class="bio-edit-area" id="bioInput" maxlength="300" placeholder="Kendin hakkında kısa bir şey yaz...">${bio}</textarea>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-accent btn-sm" onclick="saveBio()">Kaydet</button>
      <button class="btn btn-ghost btn-sm" onclick="renderProfileHeader(profileData)">İptal</button>
    </div>`;
}
async function saveBio() {
  const bio = document.getElementById('bioInput').value.trim();
  const btn = document.querySelector('#bioDisplay .btn-accent');
  if (btn) btn.innerHTML = '<span class="spinner"></span>';
  const data = await apiCall('/api/profile/me/info', 'PUT', { bio });
  if (data.error) { showToast(data.error, 'err'); return; }
  profileData.user.bio = bio;
  // navbar'daki user objesini de güncelle
  if (user) user.bio = bio;
  renderProfileHeader(profileData);
  showToast('Bio güncellendi!', 'ok');
}

// Araç sil
async function deleteCar(id) {
  if (!confirm('Bu aracı silmek istediğine emin misin?')) return;
  const data = await apiCall('/api/profile/me/cars/' + id, 'DELETE');
  if (data.error) { showToast(data.error, 'err'); return; }
  profileData.cars = profileData.cars.filter(c => c.id !== id);
  renderProfileHeader(profileData);
  renderProfileTab('cars');
  showToast('Araç silindi.', 'ok');
}

// Araç ekle
document.getElementById('doAddCar').addEventListener('click', async () => {
  const brand = document.getElementById('car_brand').value.trim();
  const model = document.getElementById('car_model').value.trim();
  const year  = parseInt(document.getElementById('car_year').value);
  const from  = document.getElementById('car_from').value;
  const to    = document.getElementById('car_to').value;
  const notes = document.getElementById('car_notes').value.trim();
  const errEl = document.getElementById('carErr');
  if (!brand || !model || !year) { errEl.textContent='Marka, model ve yıl zorunlu.'; errEl.classList.add('show'); return; }
  const btn2 = document.getElementById('doAddCar');
  btn2.innerHTML = '<span class="spinner"></span>';
  const data = await apiCall('/api/profile/me/cars', 'POST', {
    brand, model, year,
    owned_from: from ? parseInt(from) : null,
    owned_to:   to   ? parseInt(to)   : null,
    is_current: !to,
    notes: notes || null
  });
  btn2.textContent = 'Ekle';
  if (data.error || data.errors) { errEl.textContent = data.error || data.errors[0].msg; errEl.classList.add('show'); return; }
  if (profileData) {
    profileData.cars.unshift(data.car);
    renderProfileHeader(profileData);
    renderProfileTab('cars');
  }
  closeModal('addCarModal');
  ['car_brand','car_model','car_year','car_from','car_to','car_notes'].forEach(id => document.getElementById(id).value = '');
  showToast('Araç eklendi!', 'ok');
});

document.getElementById('closeAddCar').onclick = () => closeModal('addCarModal');
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'btnAddCarInline') openModal('addCarModal');
});


// ── ARAMA ────────────────────────────────────────────────────
let searchTimer = null;
const searchInput = document.getElementById('searchInput');
const searchDrop  = document.getElementById('searchDropdown');

searchInput.addEventListener('input', function() {
  clearTimeout(searchTimer);
  const q = this.value.trim();
  if (q.length < 2) { searchDrop.classList.remove('open'); return; }
  searchDrop.innerHTML = '<div class="search-loading">Aranıyor...</div>';
  searchDrop.classList.add('open');
  searchTimer = setTimeout(async () => {
    try {
      const data = await apiCall('/api/search?q=' + encodeURIComponent(q), 'GET');
      if (!data.results.length) {
        searchDrop.innerHTML = '<div class="search-empty">Sonuç bulunamadı.</div>';
        return;
      }
      searchDrop.innerHTML = data.results.map(r => `
        <div class="search-result" onclick="searchSelect(${r.id})">
          <div class="search-result-title">${r.title}</div>
          <div class="search-result-meta">📂 ${r.category_name} · 💬 ${r.reply_count} yanıt · 👤 ${r.author}</div>
        </div>`).join('');
    } catch(e) { searchDrop.innerHTML = '<div class="search-empty">Hata oluştu.</div>'; }
  }, 350);
});

function searchSelect(threadId) {
  searchDrop.classList.remove('open');
  searchInput.value = '';
  // Statik listede bul, yoksa scroll
  const t = threads.find(x => x.id === threadId);
  if (t) openThread(t.id, t.slug || '');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.nav-search')) searchDrop.classList.remove('open');
});

// ── RESİM YÜKLEME ────────────────────────────────────────────
let ntImages = [];
let replyImages = [];

function addImages(input) {
  const files = Array.from(input.files);
  files.forEach(file => {
    if (file.size > 2000000) { showToast('Resim max 2MB olmalı.', 'err'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      ntImages.push(e.target.result);
      renderNtImages();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function renderNtImages() {
  const area = document.getElementById('ntImgArea');
  const thumbs = ntImages.map((img, i) => `
    <div class="img-thumb-wrap">
      <img class="img-thumb" src="${img}">
      <div class="img-thumb-del" onclick="removeNtImg(${i})">✕</div>
    </div>`).join('');
  area.innerHTML = thumbs + `<label class="img-upload-btn">📷 Ekle<input type="file" accept="image/*" multiple style="display:none" onchange="addImages(this)"></label>`;
}

function removeNtImg(i) { ntImages.splice(i, 1); renderNtImages(); }

function addReplyImages(input) {
  const files = Array.from(input.files);
  files.forEach(file => {
    if (file.size > 2000000) { showToast('Resim max 2MB.', 'err'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      replyImages.push(e.target.result);
      renderReplyImages();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function renderReplyImages() {
  const area = document.getElementById('replyImgArea');
  if (!area) return;
  const thumbs = replyImages.map((img, i) => `
    <div class="img-thumb-wrap">
      <img class="img-thumb" src="${img}">
      <div class="img-thumb-del" onclick="removeReplyImg(${i})">✕</div>
    </div>`).join('');
  area.innerHTML = thumbs + `<label class="img-upload-btn">📷 Fotoğraf<input type="file" accept="image/*" multiple style="display:none" onchange="addReplyImages(this)"></label>`;
}

function removeReplyImg(i) { replyImages.splice(i, 1); renderReplyImages(); }

// Resim tam ekran
function openImg(src) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:500;display:grid;place-items:center;cursor:pointer';
  ov.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:8px">`;
  ov.onclick = () => ov.remove();
  document.body.appendChild(ov);
}

// ── İLAN ÖNİZLEME ────────────────────────────────────────────
let currentPreview = null;

document.addEventListener('click', async function(e) {
  if (!e.target || e.target.id !== 'btnFetchPreview') return;
  const link = document.getElementById('nt_link').value.trim();
  if (!link) return;
  const btn = e.target;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    const data = await apiCall('/api/preview', 'POST', { url: link });
    btn.textContent = 'Önizle';
    if (data.error) { showToast(data.error, 'err'); return; }
    currentPreview = data;
    const pc = document.getElementById('previewCard');
    if (pc) {
      const img = data.image ? '<img class="preview-img" src="' + data.image + '" onerror="this.remove()">' : '';
      const price = data.price ? '<div class="preview-price">' + data.price + '</div>' : '';
      pc.innerHTML = '<a href="' + data.url + '" target="_blank" style="text-decoration:none">'
        + '<div class="preview-card" style="max-height:none;margin-top:8px">'
        + img
        + '<div class="preview-body">'
        + '<div class="preview-site">' + data.site + '</div>'
        + '<div class="preview-title">' + (data.title || 'Başlık yok') + '</div>'
        + price
        + '<div class="preview-desc">' + (data.description || '') + '</div>'
        + '</div></div></a>';
    }
  } catch(e2) { btn.textContent = 'Önizle'; showToast('Önizleme alınamadı.', 'err'); }
});

// ── OTURUM KONTROL (sayfa yüklendiğinde) ─────────────────────
(async () => {
  try {
    const data = await apiCall('/api/auth/me', 'GET');
    if (data.user) setUser({ username: data.user.username, ava: data.user.username[0].toUpperCase(), role: data.user.role });
  } catch(_) {}
})();

// ══════════════════════════════════════════════════════════════
// URL ROUTING
// ══════════════════════════════════════════════════════════════
function navigate(path, replace = false) {
  history[replace ? 'replaceState' : 'pushState']({path}, '', path);
  handleRoute(path);
}
function navigateBack() {
  if (history.length > 1) history.back();
  else { goHome(); navigate('/', true); }
}
function handleRoute(path) {
  path = path || location.pathname;
  const parts = path.replace(/^\//, '').split('/');
  const type = parts[0];
  const arg = parts[1];
  // Önce tüm sayfaları kapat
  ['threadPage','profilePage','postDetailPage','messagesPage'].forEach(id => {
    document.getElementById(id)?.classList.remove('open');
  });
  if (type === 'post' && arg) {
    renderPostDetail(arg);
    document.getElementById('postDetailPage').classList.add('open');
  } else if (type === 'thread' && arg) {
    openThread(null, arg);
  } else if (type === 'profile' && arg) {
    _openProfile(arg);
  } else if (type === 'messages') {
    document.getElementById('messagesPage').classList.add('open');
    if (arg) openConversation(arg);
    else renderMsgSidebar();
  }
}
window.addEventListener('popstate', () => handleRoute(location.pathname));

// ── Post detay render ─────────────────────────────────────────
function renderPostDetail(id) {
  const p = feedData.find(x => x.id == id);
  const el = document.getElementById('postDetailContent');
  if (!p) { el.innerHTML = '<div style="color:var(--text3)">Gönderi bulunamadı.</div>'; return; }
  const tags = extractTags(p.text);
  const tagRow = tags.length ? `<div class="feed-tag-row" style="margin-bottom:12px">${tags.map(t=>`<span class="feed-auto-tag">#${t}</span>`).join('')}</div>` : '';
  const allComments = p.comments.map(c => feedCommentHtml(c, p.id, false)).join('');
  el.innerHTML = `
    <div class="post-detail-header">
      <div class="post-detail-ava ${avaColor(p.author)}">${escapeHtml(p.ava)}</div>
      <div class="post-detail-meta">
        <div class="post-detail-author" onclick="navigate('/profile/${escapeHtml(p.author)}')">${escapeHtml(p.author)}</div>
        <div class="post-detail-time">${escapeHtml(p.time)}</div>
      </div>
    </div>
    <div class="post-detail-text">${escapeHtml(p.text)}</div>
    ${tagRow}
    <div class="post-detail-actions">
      <button class="post-detail-btn ${p.liked?'liked':''}" onclick="likeFeedDetail(${p.id},this)">♥ ${p.likes} Beğeni</button>
      <button class="post-detail-btn ${p.shared?'shared':''}" onclick="shareFeed(${p.id},this)">🔁 ${p.shares} Paylaşım</button>
    </div>
    <div class="post-detail-comments-title">${p.comments.length} Yorum</div>
    <div id="pdComments-${p.id}">${allComments}</div>
    <div class="feed-comment-form" style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
      <div class="feed-comment-ava ${user?avaColor(user.username):''}">${user?escapeHtml(user.ava||user.username[0].toUpperCase()):'👤'}</div>
      <textarea class="feed-comment-input" id="pdc-${p.id}" rows="2" placeholder="Yorum yaz..." onkeydown="commentKeydown(event,${p.id})"></textarea>
      <button class="feed-comment-send" onclick="submitCommentDetail(${p.id})">➤</button>
    </div>`;
}
async function submitCommentDetail(id) {
  const inp = document.getElementById('pdc-' + id);
  const txt = inp?.value.trim();
  if (!txt) return;
  const p = feedData.find(x => x.id === id);
  if (!p) return;
  const c = { id: Date.now(), ava: user?(user.ava||user.username[0].toUpperCase()):'👤', author: user?user.username:'Misafir', time:'Az önce', text: txt, replies:[] };
  p.comments.push(c);
  syncFeedState();
  const list = document.getElementById('pdComments-' + id);
  list?.insertAdjacentHTML('beforeend', feedCommentHtml(c, id, false));
  inp.value = '';
  // Feed kartındaki yorum sayacını da güncelle
  const countEl = document.querySelector(`#fi-${id} .feed-btn:nth-child(2) span`);
  if (countEl) { p.comment_count = (p.comment_count || 0) + 1; countEl.textContent = p.comment_count; }
  try { await apiCall('/api/feed/' + id + '/comment', 'POST', {text: txt}); } catch(_){ showToast('Yorum gönderilemedi.', 'err'); }
}
function likeFeedDetail(id, btn) {
  likeFeed(id, btn);
  const likeBtn = document.querySelector(`#fi-${id} .feed-btn.liked, #fi-${id} .feed-btn:first-child`);
}

// ── openProfile güncelle: navigate kullan ─────────────────────
function _openProfile(username) {
  if (!username) return;
  document.getElementById('profilePage').classList.add('open');
  document.getElementById('profilePage').querySelector('div').scrollTop = 0;
  updateProfileTitle(username);
  document.getElementById('profileHeader').innerHTML = '<div style="padding:20px;color:var(--text3);font-size:.85rem">Yükleniyor...</div>';
  document.getElementById('profileTabsEl').innerHTML = '';
  document.getElementById('profileContent').innerHTML = '';
  loadProfile(username);
}

// ══════════════════════════════════════════════════════════════
// ŞİKAYET
// ══════════════════════════════════════════════════════════════
let _reportTarget = null;

function openReport(type, id) {
  if (!user) { showToast('Şikayet için giriş yap.', 'err'); return; }
  _reportTarget = { type, id };
  document.getElementById('reportReason').value = '';
  document.getElementById('reportErr').textContent = '';
  document.getElementById('reportModal').classList.add('open');
  closeAllMenus();
}

function closeReportModal() {
  document.getElementById('reportModal').classList.remove('open');
  _reportTarget = null;
}

async function submitReport() {
  if (!_reportTarget) return;
  const reason = document.getElementById('reportReason').value;
  if (!reason) { document.getElementById('reportErr').textContent = 'Lütfen bir neden seçin.'; return; }
  const btn = document.getElementById('btnSubmitReport');
  btnLoading(btn, true);
  try {
    const res = await apiCall('/api/reports', 'POST', {
      target_type: _reportTarget.type,
      target_id: _reportTarget.id,
      reason,
    });
    if (res.errors) { document.getElementById('reportErr').textContent = res.errors[0]?.msg || 'Hata.'; btnLoading(btn, false); return; }
    closeReportModal();
    showToast('Şikayetiniz alındı.', 'ok');
  } catch(e) {
    document.getElementById('reportErr').textContent = 'Gönderim başarısız, tekrar dene.';
  }
  btnLoading(btn, false);
}

// ══════════════════════════════════════════════════════════════
// ENGELLEME
// ══════════════════════════════════════════════════════════════
let blockedUsers = new Set(JSON.parse(localStorage.getItem('berra_blocked') || '[]'));
function saveBlocked() { localStorage.setItem('berra_blocked', JSON.stringify([...blockedUsers])); }
function isBlocked(username) { return blockedUsers.has(username); }
function blockUser(username) {
  blockedUsers.add(username); saveBlocked();
  syncFeedState();
  showToast(username + ' engellendi.', 'ok');
  renderFeed(feedData);
}
function unblockUser(username) {
  blockedUsers.delete(username); saveBlocked();
  syncFeedState();
  showToast(username + ' engeli kaldırıldı.', 'ok');
  renderFeed(feedData);
}
function blockAndRefresh(username) { blockUser(username); }
function toggleBlock(username) {
  isBlocked(username) ? unblockUser(username) : blockUser(username);
  if (profileData?.user?.username === username) renderProfileHeader(profileData);
}

// ══════════════════════════════════════════════════════════════
// TAKİP SİSTEMİ
// ══════════════════════════════════════════════════════════════
let following = new Set(JSON.parse(localStorage.getItem('berra_following') || '[]'));
function saveFollowing() { localStorage.setItem('berra_following', JSON.stringify([...following])); }
function isFollowing(username) { return following.has(username); }
function toggleFollow(username, btn) {
  if (isFollowing(username)) {
    following.delete(username); saveFollowing();
    if (btn) { btn.textContent = 'Takip Et'; btn.classList.remove('following'); }
    showToast(username + ' takipten çıkıldı.', 'ok');
  } else {
    following.add(username); saveFollowing();
    if (btn) { btn.textContent = 'Takip Ediliyor'; btn.classList.add('following'); }
    showToast(username + ' takip edildi!', 'ok');
    // Bildirim simüle et
    notifData.unshift({id:Date.now(),type:'like',icon:'👤',text:`Siz <strong>${escapeHtml(username)}</strong> kullanıcısını takip etmeye başladınız`,time:'Az önce',read:false});
    renderNotifications();
    if (user) setUser(user);
  }
}

// ══════════════════════════════════════════════════════════════
// MESAJLAR
// ══════════════════════════════════════════════════════════════
let conversations = JSON.parse(localStorage.getItem('berra_msgs') || '{}');
function saveMsgs() { localStorage.setItem('berra_msgs', JSON.stringify(conversations)); }
let activeMsgUser = null;

function openMessages(toUser) {
  document.getElementById('messagesPage').classList.add('open');
  navigate('/messages' + (toUser ? '/' + toUser : ''), false);
  renderMsgSidebar();
  if (toUser) openConversation(toUser);
}
function openNotifPanel() {
  document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.feed-panel').forEach(p => p.classList.remove('active'));
  const tab = document.querySelector('.feed-tab[data-panel="bildirim"]');
  const panel = document.getElementById('panelBildirim');
  if (tab) tab.classList.add('active');
  if (panel) panel.classList.add('active');
  renderNotifications();
}
function renderMsgSidebar() {
  const list = document.getElementById('msgConvList');
  const convUsers = Object.keys(conversations);
  if (!convUsers.length) {
    list.innerHTML = '<div style="padding:20px;color:var(--text3);font-size:.83rem">Henüz mesaj yok.</div>';
    return;
  }
  list.innerHTML = convUsers.map(u => {
    const msgs = conversations[u];
    const last = msgs[msgs.length - 1];
    const unread = msgs.filter(m => !m.read && m.from !== (user?.username||'')).length;
    return `<div class="msg-conv-item ${activeMsgUser===u?'active':''}" onclick="openConversation('${escapeHtml(u)}')">
      <div class="msg-conv-ava ${avaColor(u)}">${u[0].toUpperCase()}</div>
      <div class="msg-conv-info">
        <div class="msg-conv-name">${escapeHtml(u)}</div>
        <div class="msg-conv-preview">${last ? escapeHtml(last.text.slice(0,40)) : ''}</div>
      </div>
      ${unread ? `<div class="msg-conv-unread"></div>` : ''}
    </div>`;
  }).join('');
}
function openConversation(toUser) {
  activeMsgUser = toUser;
  if (!conversations[toUser]) conversations[toUser] = [];
  // Mark read
  conversations[toUser].forEach(m => { if (m.from !== (user?.username||'')) m.read = true; });
  saveMsgs();
  renderMsgSidebar();
  const main = document.getElementById('msgMain');
  const msgs = conversations[toUser];
  main.innerHTML = `
    <div class="msg-main-top">
      <div class="msg-conv-ava ${avaColor(toUser)}" style="width:34px;height:34px;font-size:.85rem">${toUser[0].toUpperCase()}</div>
      <div>
        <div class="msg-main-name">${escapeHtml(toUser)}</div>
        <div style="font-size:.72rem;color:var(--text3)">@${escapeHtml(toUser.toLowerCase())}</div>
      </div>
      <div style="margin-left:auto">
        <button class="btn btn-ghost btn-sm" onclick="navigate('/profile/${escapeHtml(toUser)}');document.getElementById('messagesPage').classList.remove('open')">Profil</button>
      </div>
    </div>
    <div class="msg-thread" id="msgThread-${toUser.replace(/\W/g,'_')}">
      ${msgs.length ? msgs.map(m => msgBubbleHtml(m, user?.username)).join('') : '<div class="msg-empty"><div class="msg-empty-icon">👋</div><span>Merhaba de!</span></div>'}
    </div>
    <div class="msg-input-area">
      <textarea class="msg-input" id="msgInput" rows="1" placeholder="Mesaj yaz..." onkeydown="msgKeydown(event,'${escapeHtml(toUser)}')"></textarea>
      <button class="msg-send-btn" onclick="sendMessage('${escapeHtml(toUser)}')">➤</button>
    </div>`;
  document.getElementById('msgThread-' + toUser.replace(/\W/g,'_'))?.scrollTo(0, 99999);
}
function msgBubbleHtml(m, myUsername) {
  const mine = m.from === myUsername;
  return `<div class="msg-bubble-wrap ${mine?'mine':''}">
    <div>
      <div class="msg-bubble">${escapeHtml(m.text)}</div>
      <div class="msg-time">${escapeHtml(m.time)}</div>
    </div>
  </div>`;
}
function sendMessage(toUser) {
  const inp = document.getElementById('msgInput');
  const txt = inp?.value.trim();
  if (!txt) return;
  if (!conversations[toUser]) conversations[toUser] = [];
  const msg = { id: Date.now(), from: user?.username || 'Sen', text: txt, time: 'Az önce', read: true };
  conversations[toUser].push(msg);
  saveMsgs();
  const thread = document.getElementById('msgThread-' + toUser.replace(/\W/g,'_'));
  if (thread) {
    thread.insertAdjacentHTML('beforeend', msgBubbleHtml(msg, user?.username || 'Sen'));
    thread.scrollTo(0, 99999);
  }
  inp.value = '';
  autoResize(inp);
}
function msgKeydown(e, toUser) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(toUser); }
}

// ══════════════════════════════════════════════════════════════
// 3-NOKTA MENÜ
// ══════════════════════════════════════════════════════════════
function togglePostMenu(id) {
  closeAllMenus();
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
function closeAllMenus() {
  document.querySelectorAll('.post-menu-dropdown.open').forEach(el => el.classList.remove('open'));
}
document.addEventListener('click', e => {
  if (!e.target.closest('.post-menu-wrap')) closeAllMenus();
});

// ══════════════════════════════════════════════════════════════
// NESTED YORUMLAR
// ══════════════════════════════════════════════════════════════
function toggleCommentReply(postId, commentId) {
  const form = document.getElementById(`cr-${postId}-${commentId}`);
  if (!form) return;
  const isShown = form.classList.contains('show');
  form.classList.toggle('show', !isShown);
  if (!isShown) document.getElementById(`cri-${postId}-${commentId}`)?.focus();
}
function submitReply(postId, commentId) {
  const inp = document.getElementById(`cri-${postId}-${commentId}`);
  const txt = inp?.value.trim();
  if (!txt) return;
  const p = feedData.find(x => x.id === postId);
  if (!p) return;
  const c = p.comments.find(x => x.id === commentId);
  if (!c) return;
  if (!c.replies) c.replies = [];
  const reply = { id: Date.now(), ava: user?(user.ava||user.username[0].toUpperCase()):'👤', author: user?user.username:'Misafir', time:'Az önce', text: txt };
  c.replies.push(reply);
  const repliesEl = document.getElementById(`crp-${postId}-${commentId}`);
  if (repliesEl) repliesEl.insertAdjacentHTML('beforeend', feedCommentHtml(reply, postId, true));
  inp.value = '';
  document.getElementById(`cr-${postId}-${commentId}`)?.classList.remove('show');
  showToast('Yanıt gönderildi!', 'ok');
}
function replyKeydown(e, postId, commentId) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(postId, commentId); }
}

// ══════════════════════════════════════════════════════════════
// UX FİXLERİ
// ══════════════════════════════════════════════════════════════
// Auto-resize textarea
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}
document.addEventListener('input', e => {
  if (e.target.matches('textarea')) autoResize(e.target);
});
// Escape ile kapat
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    // Modal kapat
    const openOverlay = document.querySelector('.overlay.open');
    if (openOverlay) { openOverlay.classList.remove('open'); return; }
    // Sayfaları kapat (ters sıra)
    const pages = ['postDetailPage','messagesPage','profilePage','threadPage'];
    for (const id of pages) {
      const page = document.getElementById(id);
      if (page?.classList.contains('open')) { navigateBack(); return; }
    }
  }
  // j/k navigasyon (akış açıkken)
  if (document.querySelector('.feed-panel.active')?.id === 'panelAkis') {
    const items = [...document.querySelectorAll('.feed-item')];
    if (!items.length) return;
    const visible = items.findIndex(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.top < window.innerHeight / 2;
    });
    if (e.key === 'j' && visible < items.length - 1) {
      items[visible + 1]?.scrollIntoView({behavior:'smooth', block:'start'});
    } else if (e.key === 'k' && visible > 0) {
      items[visible - 1]?.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }
});
// Double-click ile konuya git
document.addEventListener('dblclick', e => {
  const card = e.target.closest('.feed-item');
  if (!card || e.target.closest('.feed-actions')) return;
  const id = parseInt(card.id.replace('fi-', ''));
  if (!id) return;
  openThreadFromFeed(id);
});

// ── FEED INFINITE SCROLL ──────────────────────────────────────
let feedPage = 1;
let feedLoading = false;
let feedHasMore = true;

function appendFeedPosts(posts) {
  const el = document.getElementById('feedList');
  el.insertAdjacentHTML('beforeend', posts.map((p, i) => feedCard(p, i * 0.04)).join(''));
}

async function loadMoreFeed() {
  if (feedLoading || !feedHasMore) return;
  feedLoading = true;
  const indicator = document.getElementById('feedLoadMore');
  if (indicator) indicator.style.display = 'block';
  try {
    const data = await apiCall('/api/forum/threads?page=' + feedPage + '&limit=10', 'GET');
    if (data.threads && data.threads.length > 0) {
      const newPosts = data.threads.map(p => ({
        id: p.id,
        slug: p.slug,
        ava: p.username ? p.username[0].toUpperCase() : '?',
        author: p.username || 'anonim',
        time: timeAgo ? timeAgo(p.last_post_at || p.created_at) : 'önce',
        text: p.title,
        cat: p.category_name || 'Genel',
        likes: 0,
        liked: false,
        shares: 0,
        shared: false,
        comments: [],
        comment_count: p.reply_count || 0,
        views: p.view_count || 0,
        pinned: !!p.is_pinned,
        locked: !!p.is_locked,
      }));
      // Duplicate kontrolü
      const existing = new Set(feedData.map(x => x.id));
      const fresh = newPosts.filter(x => !existing.has(x.id));
      feedData = [...feedData, ...fresh];
      syncFeedState();
      if (feedPage === 1) {
        renderFeed(feedData);
      } else {
        appendFeedPosts(fresh);
      }
      feedPage++;
      if (data.threads.length < (data.limit || 10)) feedHasMore = false;
    } else {
      feedHasMore = false;
    }
  } catch(e) { /* API yoksa statik data göster */ }
  feedLoading = false;
  if (indicator) indicator.style.display = 'none';
  // Feed hâlâ boşsa boş durum mesajı göster
  setTimeout(() => {
    const el = document.getElementById('feedList');
    if (el && !el.querySelector('.feed-item')) renderFeedEmpty();
  }, 100);
}

// Scroll dinle — akış panelinde
document.getElementById('panelAkis').addEventListener('scroll', () => {
  const el = document.getElementById('panelAkis');
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
    loadMoreFeed();
  }
});

// ── SEKME SİSTEMİ ─────────────────────────────────────────────
document.getElementById('feedTabs').addEventListener('click', e => {
  const btn = e.target.closest('.feed-tab');
  if (!btn) return;
  document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const panelId = 'panel' + btn.dataset.panel.charAt(0).toUpperCase() + btn.dataset.panel.slice(1);
  document.querySelectorAll('.feed-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  if (btn.dataset.panel === 'kesf') renderExplore();
  if (btn.dataset.panel === 'bildirim') renderNotifications();
});

// ── KATEGORİ SAYILARI ─────────────────────────────────────────
function updateCatCounts() {
  const all = STATIC_THREADS;
  const counts = {all: all.length, genel:0, ilk:0, modifiye:0, ilan:0, ariza:0};
  const catMap = {'Genel':'genel','İlk Araba':'ilk','Modifiye':'modifiye','İlan Yorumu':'ilan','Arıza/Bakım':'ariza','Duyuru':'genel'};
  all.forEach(t => { const k = catMap[t.cat]; if(k) counts[k]++; });
  Object.entries(counts).forEach(([k,v]) => {
    const el = document.getElementById('cnt-' + k);
    if (el) el.textContent = v;
  });
}

// ── KEŞİFET RENDER ────────────────────────────────────────────
const TRENDS = ['#Corolla','#BMW_E90','#LPG','#İlkAraba','#Passat','#Togg','#Modifiye','#EgzozSesi','#YakıtTasarrufu','#ServisÖnerisi'];
const ACTIVE_USERS = [
  {ava:'T',name:'Turbo_Berk',meta:'47 konu · 132 yanıt',handle:'@turbo_berk'},
  {ava:'E',name:'elif_yilmaz',meta:'31 konu · 89 yanıt',handle:'@elif_yilmaz'},
  {ava:'D',name:'dizel_ahmet',meta:'28 konu · 74 yanıt',handle:'@dizel_ahmet'},
];
function renderExplore() {
  // İstatistik
  const tCount = STATIC_THREADS.length + threads.length;
  const rCount = STATIC_THREADS.reduce((a,t) => a + t.replies, 0);
  document.getElementById('statThreads').textContent = tCount;
  document.getElementById('statReplies').textContent = rCount;
  document.getElementById('statPosts').textContent = feedData.length;
  // Öne çıkan: en çok görüntülenen
  const top = [...STATIC_THREADS].sort((a,b) => b.views - a.views)[0];
  document.getElementById('featuredThread').innerHTML = top ? `
    <div class="featured-card" onclick="navigate('/thread/${escapeHtml(top.slug||String(top.id))}')"
      <div class="featured-tag">📌 ${escapeHtml(top.cat)}</div>
      <div class="featured-title">${escapeHtml(top.title)}</div>
      <div class="featured-preview">${escapeHtml(top.sub)}</div>
      <div class="featured-meta"><span>💬 ${top.replies} yanıt</span><span>👁 ${top.views} görüntüleme</span><span>🕐 ${top.time}</span></div>
    </div>` : '';
  // Trend konular
  document.getElementById('trendTags').innerHTML = TRENDS.map(t =>
    `<span class="trend-tag" onclick="searchTag('${escapeHtml(t)}')">${escapeHtml(t)}</span>`
  ).join('');
  // Aktif kullanıcılar
  document.getElementById('activeUsers').innerHTML = ACTIVE_USERS.map(u => `
    <div class="active-user" onclick="navigate('/profile/${escapeHtml(u.name)}')"
      <div class="active-user-ava">${u.ava}</div>
      <div class="active-user-info">
        <div class="active-user-name">${escapeHtml(u.name)}</div>
        <div class="active-user-meta">${escapeHtml(u.meta)}</div>
      </div>
    </div>`).join('');
}
function searchTag(tag) {
  document.getElementById('searchInput').value = tag.replace('#','');
  document.getElementById('searchInput').dispatchEvent(new Event('input'));
}

// ── BİLDİRİMLER RENDER ────────────────────────────────────────
let notifData = [
  {id:1,type:'like',icon:'♥',text:'<strong>Turbo_Berk</strong> gönderini beğendi',time:'5 dk',read:false},
  {id:2,type:'comment',icon:'💬',text:'<strong>dizel_ahmet</strong> gönderine yorum yazdı: "Ben 2 yıl önce geçtim..."',time:'18 dk',read:false},
  {id:3,type:'badge',icon:'⭐',text:'Yeni rozet kazandın: <strong>İlk Paylaşım</strong>',time:'1 saat',read:false},
  {id:4,type:'like',icon:'♥',text:'<strong>elif_yilmaz</strong> ve 3 kişi daha gönderini beğendi',time:'2 saat',read:true},
  {id:5,type:'comment',icon:'💬',text:'<strong>Murat_K</strong> konuna yanıt yazdı',time:'3 saat',read:true},
];
function renderNotifications() {
  const unread = notifData.filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  if (badge) { badge.textContent = unread; badge.style.display = unread ? 'inline-flex' : 'none'; }
  document.getElementById('notifList').innerHTML = notifData.map(n => `
    <div class="notif-item ${n.read?'':'unread'}" onclick="readNotif(${n.id},this)">
      <div class="notif-icon ${n.type}">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
      ${!n.read ? '<div class="notif-dot"></div>' : ''}
    </div>`).join('');
}
function readNotif(id, el) {
  const n = notifData.find(x => x.id === id);
  if (n && !n.read) { n.read = true; el.classList.remove('unread'); el.querySelector('.notif-dot')?.remove(); renderNotifications(); }
}
function markAllRead() {
  notifData.forEach(n => n.read = true);
  renderNotifications();
}
// Profil sayfasına başlık güncelleme
function updateProfileTitle(name) {
  const el = document.getElementById('profilePageTitle');
  if (el) el.textContent = name || 'Profil';
}

// ══════════════════════════════════════════════════════════════
// LOADING STATE YARDIMCISI
// ══════════════════════════════════════════════════════════════
function btnLoading(btn, on) {
  if (!btn) return;
  if (on) { btn.dataset.orig = btn.innerHTML; btn.innerHTML = '<span style="display:inline-block;animation:spin .7s linear infinite">⟳</span>'; btn.disabled = true; }
  else { btn.innerHTML = btn.dataset.orig ?? btn.innerHTML; btn.disabled = false; }
}
// CSS spin animasyonu
(function() {
  if (!document.getElementById('spinStyle')) {
    const s = document.createElement('style');
    s.id = 'spinStyle';
    s.textContent = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
})();

// ══════════════════════════════════════════════════════════════
// NAVBAR BADGE GÜNCELLEME
// ══════════════════════════════════════════════════════════════
function renderNavBadges() {
  if (!user) return;
  const unread = notifData.filter(n => !n.read).length;
  const msgUnread = Object.values(conversations).reduce((a, msgs) =>
    a + msgs.filter(m => !m.read && m.from !== user.username).length, 0);
  const nb = document.getElementById('navNotifBadge');
  const mb = document.querySelector('.nav-msg-btn .msg-badge');
  if (nb) { nb.textContent = unread; nb.style.display = unread ? '' : 'none'; }
  if (mb) { mb.textContent = msgUnread; mb.style.display = msgUnread ? '' : 'none'; }
}

// ══════════════════════════════════════════════════════════════
// BLOCK FIX: profil sayfasında UI güncelle
// ══════════════════════════════════════════════════════════════
// Override toggleBlock - profil sayfasındaysa header'ı da güncelle
function toggleBlock(username) {
  if (isBlocked(username)) {
    blockedUsers.delete(username); saveBlocked();
  syncFeedState();
    showToast(username + ' engeli kaldırıldı.', 'ok');
  } else {
    blockedUsers.add(username); saveBlocked();
  syncFeedState();
    showToast(username + ' engellendi.', 'ok');
    // Feed kartını animasyonlu kaldır
    const card = document.getElementById('fi-0'); // generic
    document.querySelectorAll('.feed-item').forEach(el => {
      const authorEl = el.querySelector('.feed-author');
      if (authorEl && authorEl.textContent === username) {
        el.classList.add('card-removing');
        setTimeout(() => el.remove(), 350);
      }
    });
  }
  // Profil sayfasındaysa butonları yenile
  if (profileData?.user?.username === username) {
    renderProfileHeader(profileData);
  }
}

// ══════════════════════════════════════════════════════════════
// MESSAGES: ID normalize
// ══════════════════════════════════════════════════════════════
function msgSafeId(username) {
  return username.replace(/[^a-zA-Z0-9_\-]/g, '_');
}
// openConversation'ı override et - güvenli ID kullan
function openConversation(toUser) {
  activeMsgUser = toUser;
  if (!conversations[toUser]) conversations[toUser] = [];
  conversations[toUser].forEach(m => { if (m.from !== (user?.username||'')) m.read = true; });
  saveMsgs();
  renderMsgSidebar();
  renderNavBadges();
  const safeId = msgSafeId(toUser);
  const main = document.getElementById('msgMain');
  const msgs = conversations[toUser];
  main.innerHTML = `
    <div class="msg-main-top">
      <button class="msg-back-btn btn btn-icon" onclick="showMsgSidebar()" style="margin-right:6px" aria-label="Geri">←</button>
      <div class="msg-conv-ava ${avaColor(toUser)}" style="width:34px;height:34px;font-size:.85rem;flex-shrink:0">${toUser[0].toUpperCase()}</div>
      <div>
        <div class="msg-main-name">${escapeHtml(toUser)}</div>
        <div style="font-size:.72rem;color:var(--text3)">@${escapeHtml(toUser.toLowerCase())}</div>
      </div>
      <div style="margin-left:auto">
        <button class="btn btn-ghost btn-sm" onclick="navigate('/profile/${escapeHtml(toUser)}');document.getElementById('messagesPage').classList.remove('open')">Profil</button>
      </div>
    </div>
    <div class="msg-thread" id="mt-${safeId}">
      ${msgs.length ? msgs.map(m => msgBubbleHtml(m, user?.username)).join('') : '<div class="msg-empty"><div class="msg-empty-icon">👋</div><span>Merhaba de!</span></div>'}
    </div>
    <div class="msg-input-area">
      <textarea class="msg-input" id="msgInput" rows="1" placeholder="Mesaj yaz..." aria-label="Mesaj yaz" onkeydown="msgKeydown(event,'${escapeHtml(toUser)}')"></textarea>
      <button class="msg-send-btn" onclick="sendMessage('${escapeHtml(toUser)}')" aria-label="Gönder">➤</button>
    </div>`;
  document.getElementById('mt-' + safeId)?.scrollTo(0, 99999);
}
// sendMessage'ı da safe ID ile güncelle
function sendMessage(toUser) {
  const inp = document.getElementById('msgInput');
  const txt = inp?.value.trim();
  if (!txt) return;
  if (!conversations[toUser]) conversations[toUser] = [];
  const msg = { id: Date.now(), from: user?.username || 'Sen', text: txt, time: 'Az önce', read: true };
  conversations[toUser].push(msg);
  saveMsgs();
  const safeId = msgSafeId(toUser);
  const thread = document.getElementById('mt-' + safeId);
  if (thread) {
    thread.insertAdjacentHTML('beforeend', msgBubbleHtml(msg, user?.username || 'Sen'));
    thread.scrollTo(0, 99999);
  }
  inp.value = '';
  if (inp) autoResize(inp);
  renderNavBadges();
}
function showMsgSidebar() {
  const sidebar = document.querySelector('.msg-sidebar');
  if (sidebar) sidebar.classList.toggle('show-mobile');
}

// ══════════════════════════════════════════════════════════════
// MOBİL HAMBURGER MENÜ
// ══════════════════════════════════════════════════════════════
function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
}
// Menü dışına tıklayınca kapat
document.addEventListener('click', e => {
  if (!e.target.closest('#mobileMenu') && !e.target.closest('#btnHamburger')) {
    document.getElementById('mobileMenu')?.classList.remove('open');
  }
});

// ══════════════════════════════════════════════════════════════
// FOLLOW: notif + badge güncelle
// ══════════════════════════════════════════════════════════════
function toggleFollow(username, btn) {
  if (isFollowing(username)) {
    following.delete(username); saveFollowing();
    if (btn) { btn.textContent = 'Takip Et'; btn.classList.remove('following'); }
    showToast(username + ' takipten çıkıldı.', 'ok');
  } else {
    following.add(username); saveFollowing();
    if (btn) { btn.textContent = 'Takip Ediliyor'; btn.classList.add('following'); }
    showToast(username + ' takip edildi! 🎉', 'ok');
    notifData.unshift({id:Date.now(),type:'follow',icon:'👤',
      text:`<strong>${escapeHtml(username)}</strong> kullanıcısını takip etmeye başladın`,
      time:'Az önce',read:false});
    renderNotifications();
    renderNavBadges();
  }
  // Profil stats güncelle
  if (profileData?.user?.username === username) {
    const stat = document.querySelector('.profile-stat-num:last-of-type');
    if (stat) stat.textContent = following.size;
  }
  if (user) setUser(user);
}

// ══════════════════════════════════════════════════════════════
// FEED: boş durum + loading
// ══════════════════════════════════════════════════════════════
function renderFeedEmpty() {
  const el = document.getElementById('feedList');
  if (!el) return;
  if (!el.children.length || (el.children.length === 1 && el.firstChild.classList?.contains('skeleton-card'))) {
    el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text3)">
      <div style="font-size:2rem;margin-bottom:10px">🚗</div>
      <div style="font-size:.9rem">Henüz gönderi yok. İlk paylaşımı sen yap!</div>
    </div>`;
  }
}

// Bildirim panelini notif badge ile bağla - sayfa odaklandığında oku işaretle
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && user) renderNavBadges();
});


Object.assign(window, {
  addImages,
  addReplyImages,
  blockAndRefresh,
  closeReportModal,
  commentKeydown,
  deleteCar,
  doLogout,
  editBio,
  goHome,
  likeFeedDetail,
  likePost,
  markAllRead,
  msgKeydown,
  navigate,
  navigateBack,
  openConversation,
  openFeedPost,
  openImg,
  openMessages,
  openNotifPanel,
  openProfile,
  openReport,
  readNotif,
  removeNtImg,
  removeReplyImg,
  renderProfileHeader,
  renderProfileTab,
  replyKeydown,
  saveBio,
  searchSelect,
  searchTag,
  sendMessage,
  shareFeed,
  showMsgSidebar,
  submitCommentDetail,
  submitReply,
  submitReport,
  switchAuth,
  toggleBlock,
  toggleFollow,
  toggleMobileMenu,
  togglePostMenu,
  toggleTheme,
  triggerAvatarUpload,
  uploadAvatar,
});

// ── İLK RENDER ────────────────────────────────────────────────
renderThreads(threads);
updateCatCounts();
renderFeed(feedData);
loadMoreFeed();
renderNotifications();
// Sayfa yenilendiğinde URL route'u işle
if (location.pathname && location.pathname !== '/') {
  handleRoute(location.pathname);
}
