# Next Cutover API Matrix

Bu doküman `apps/web` tarafındaki API çağrılarını tek backend hedefi için sınıflandırır.

Durum etiketleri:

- `nest-ready`: Nest API üzerinde karşılığı var, doğrudan yeni API kontratına bağlı.
- `nest-proxied`: İstek Nest'e gelir, Nest cutover proxy ile legacy endpoint'e yönlendirir.
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
| `GET/POST /forum/*` | forum + thread pages | nest-proxied | `CutoverProxyModule` üzerinden legacy forum'a aktarılır |
| `GET/POST /businesses*` | sanayi rehberi | nest-proxied | `CutoverProxyModule` üzerinden legacy businesses'e aktarılır |
| `GET/POST/DELETE /bookmarks*` | bookmarks | nest-proxied | `CutoverProxyModule` üzerinden legacy bookmarks'a aktarılır |
| `POST /reports` | report hook | nest-proxied | `CutoverProxyModule` üzerinden legacy reports'a aktarılır |
| `GET/POST/DELETE /discovery/*` | models/thread follow | nest-proxied | `CutoverProxyModule` üzerinden legacy discovery'e aktarılır |

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

`apps/web` içinde proxy üzerinden çalışan çağrıların yanına `CUTOVER_PROXY` notu eklendi; böylece migration sırasında grep ile kolay izlenebilir:

```bash
rg "CUTOVER_PROXY" apps/web
```

Cutover proxy için `apps/api` ortamında `LEGACY_API_ORIGIN` tanımlanmalıdır.
