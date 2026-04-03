# Legacy → Next ekran parity planı

Bu doküman legacy SPA (`public/index.html` + `public/assets/js/app-init.js`) ile Next uygulaması (`apps/web/app`) arasındaki geçişi takip eder.

## 1) Legacy'de en çok kullanılan ekranlar (öncelik sırası)

Öncelik sırası, legacy uygulamadaki route/interaction yoğunluğuna göre belirlendi:

1. **Feed** (`/feed` deneyimi, ana akış + etkileşim)
2. **Thread** (`/thread/:slug`, konu detayı + yanıt)
3. **Auth** (`/login`, `/register` deneyimi; legacy'de modal tabanlı)
4. **Notifications** (`/notifications` deneyimi, okunmamış badge/merkez)

> Not: Legacy tarafta feed ve thread etkileşimleri ana kullanım akışını taşıyor; auth ve notifications daha kısa ama kritik tamamlayıcı akışlar.

## 2) Next karşılıkları + parity checklist

| Legacy ekran | Legacy davranış özeti | Next route | Parity durumu | Checklist |
|---|---|---|---|---|
| Feed | Listeleme, paylaşım, yorum/like sayaçları | `/feed` | ✅ | ✅ Listeleme, ✅ paylaşım, ✅ yorum/like etkileşimleri |
| Thread | Konu detayı, post listesi, kilitli/sabit etiketleri, yanıt | `/thread/[slug]` | ✅ (MVP+) | ✅ Detay, ✅ post listesi, ✅ yanıt ekleme, ✅ kilitli/sabit görünümü |
| Auth | Login/register akışı (legacy modal), oturum bazlı koruma | `/login`, `/register` | ✅ | ✅ form validasyonu, ✅ backend hataları, ✅ yönlendirme |
| Notifications | Bildirim listeleme, okunmamış sayısı, hepsini okundu | `/notifications` | ✅ | ✅ listeleme, ✅ unread state, ✅ mark-all-read |
| Profile | Public profil + düzenleme | `/profile/[username]`, `/profile/me/edit` | ✅ | ✅ profil görüntüleme, ✅ bio güncelleme (`PUT /profile/me`) |
| Model merkezi | Model listesi + model detay + takip | `/models`, `/models/[slug]` | ⚠️ Kısmi | ✅ ekranlar var, ⚠️ API hâlâ legacy `discovery` bağımlı |

## 3) Redirect politikası (legacy → Next)

`NEXT_APP_URL` tanımlıysa legacy sunucu aşağıdaki route'ları Next'e yönlendirir:

- `301`: `/feed` → `${NEXT_APP_URL}/feed`
- `301`: `/notifications` → `${NEXT_APP_URL}/notifications`
- `301`: `/login` → `${NEXT_APP_URL}/login`
- `301`: `/register` → `${NEXT_APP_URL}/register`
- `302`: `/thread/:slug` → `${NEXT_APP_URL}/thread/:slug`

`/thread/:slug` için başlangıçta `302` seçildi; canlı parity gözlemlerinden sonra `301`e yükseltilebilir.

## 4) Backend bağımlılık görünürlüğü

Next ekran parity'si tamamlanmış olsa bile backend migrasyonu kısmi durumdadır:

- Nest-ready akışlar: auth, feed, profile, search, notifications.
- Legacy bağımlı akışlar: forum, discovery, businesses, bookmarks, reports.

Detaylı envanter için: `docs/next-cutover-api-matrix.md`.

## 5) Legacy emeklilik planı (`public/assets/js/app-init.js`)

Aşama aşama emeklilik:

1. ✅ `app-init.js` içindeki modüler import bağımlılıkları kaldırıldı.
2. ✅ Dosya "bootstrap + deprecation" stub'una dönüştürüldü.
3. ⏭ Sonraki adım: `public/assets/js/render|state|ui` altındaki artık kullanılmayan modüllerin tamamen silinmesi.
4. ⏭ Sonraki adım: Legacy `index.html` inline script parçalarının ekran bazlı kaldırılması (feed → thread → auth → notifications sırasıyla).
