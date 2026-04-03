# Next Cutover API Matrix

Bu doküman `apps/web` tarafındaki API çağrılarını tek backend hedefi için sınıflandırır.

Durum etiketleri:

- `nest-ready`: Nest API üzerinde karşılığı var, doğrudan yeni API kontratına bağlı.
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
| `GET/POST /forum/*` | forum + thread pages | nest-ready | `ForumModule` |
| `GET/POST /businesses*` | sanayi rehberi | nest-ready | `BusinessesModule` |
| `GET/POST/DELETE /bookmarks*` | bookmarks | nest-ready | `BookmarksModule` |
| `POST /reports` | report hook | nest-ready | `ReportsModule` |
| `GET/POST/DELETE /discovery/*` | models/thread follow | nest-ready | `DiscoveryModule` |

## Karar matrisi (taşınacak / geçici kalacak)

| Alan | Karar | Kısa gerekçe |
|---|---|---|
| Auth/Feed/Profile/Search/Notifications | Nest'e taşınmış (koru) | Zaten web ile kontratlı ve aktif kullanılıyor |
| Forum | Nest'e taşındı | Forum endpointleri native controller/service ile çalışır |
| Discovery | Nest'e taşındı | Model ve follow akışları native discovery modülünde |
| Businesses | Nest'e taşındı | Listeleme/ekleme endpointleri native modülde |
| Bookmarks | Nest'e taşındı | Bookmark listele/ekle/sil native modülde |
| Reports | Nest'e taşındı | Raporlama endpointi native modülde |

## Uygulama notu

`apps/web` tarafında `forum/discovery/businesses/bookmarks/reports` çağrıları artık doğrudan Nest endpointlerine gider.

```bash
rg "apiFetch\\('/(forum|discovery|businesses|bookmarks|reports)\" apps/web -n
```
