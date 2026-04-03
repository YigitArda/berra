# Next Cutover API Matrix

Bu doküman `apps/web` tarafındaki API çağrılarını tek backend hedefi için sınıflandırır.

Durum etiketleri:

- `nest-ready`: Nest API üzerinde karşılığı var, doğrudan yeni API kontratına bağlı.
- `legacy-dependency`: Şu an legacy Express endpoint'ine bağlı, Nest modülü henüz yok.
- `dual-compatible`: Legacy ve Nest tarafında aynı kontratla çalışabilen geçiş noktası.

## Endpoint envanteri

| Web çağrısı | Kullanıldığı yer | Durum | Hedef modül / not |
|---|---|---|---|
| `GET /auth/me` | session hooks + server auth | nest-ready | `AuthController.me` |
| `POST /auth/login` | login page | nest-ready | `AuthController.login` |
| `POST /auth/register` | register page | nest-ready | `AuthController.register` |
| `POST /auth/logout` | logout hook | nest-ready | `AuthController.logout` |
| `GET /feed` | feed/following pages | nest-ready | `FeedController.list` |
| `POST /feed` | feed create | nest-ready | `FeedController.create` |
| `POST/DELETE /feed/:id/like` | feed like | nest-ready | `FeedController.like/unlike` |
| `GET /feed/:id/comments` | feed comments | nest-ready | `FeedController.comments` |
| `POST /feed/:id/comment` | feed comment | nest-ready | `FeedController.comment` |
| `GET /notifications` | notifications page/hook | nest-ready | `NotificationsController.list` |
| `PUT /notifications/read-all` | notifications page/hook | nest-ready | `NotificationsController.markAllRead` |
| `GET /profile/:username` | public profile page | dual-compatible | Legacy + Nest karşılığı var |
| `PUT /profile/me` | profile edit | nest-ready | Nest kontratına hizalandı |
| `GET /search` | search page/hook | nest-ready | `SearchController.search` |
| `GET/POST /forum/*` | forum + thread pages | legacy-dependency | Nest forum modülü eksik |
| `GET/POST /businesses*` | sanayi rehberi | legacy-dependency | Nest businesses modülü eksik |
| `GET/POST/DELETE /bookmarks*` | bookmarks | legacy-dependency | Nest bookmarks modülü eksik |
| `POST /reports` | report hook | legacy-dependency | Nest reports modülü eksik |
| `GET/POST/DELETE /discovery/*` | models/thread follow | legacy-dependency | Nest discovery modülü eksik |

## Karar matrisi (taşınacak / geçici kalacak)

| Alan | Karar | Kısa gerekçe |
|---|---|---|
| Auth/Feed/Profile/Search/Notifications | Nest'e taşınmış (koru) | Zaten web ile kontratlı ve aktif kullanılıyor |
| Forum | Nest'e taşınacak | Thread/forum ana akış için tek backend hedefinde kritik |
| Discovery | Nest'e taşınacak | Model merkezi + follow akışları Next tarafında aktif |
| Businesses | Geçici legacy, sonra Nest | Araç rehberi ekranı aktif ama iş önceliği orta |
| Bookmarks | Geçici legacy, sonra Nest | Feed/thread deneyimi için önemli; forum migration sonrası alınabilir |
| Reports | Geçici legacy, sonra Nest | Moderasyon pipeline'ı ile birlikte taşınmalı |

## Uygulama notu

`apps/web` içinde legacy bağımlı çağrıların yanına `LEGACY_DEPENDENCY` notu eklendi; böylece migration sırasında grep ile kolay izlenebilir:

```bash
rg "LEGACY_DEPENDENCY" apps/web
```
