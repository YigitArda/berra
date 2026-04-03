# arabalariseviyoruz.com

Türkiye'nin araba topluluk platformu — Forum + Akış + Araçlar.

> **Not:** Aktif legacy uygulama depo kökünde yer alır. `package.json`, `scripts/migrate.js` ve `schema.sql` dosyaları bu kök dizin için kanonik kaynaktır; yanlışlıkla alt klasörlerde çalışmayın.

## Yeni Mimari (Migration Başlangıcı)

Bu repo yeni mimari geçişi için aşağıdaki başlangıç yapısını içerir:

- `apps/api`: NestJS + Fastify + TypeScript (yeni API iskeleti)
- `apps/web`: Next.js + TypeScript (yeni frontend iskeleti)
- `packages/shared`: paylaşılan tipler (DTO/type contract)

### Yeni komutlar

```bash
npm run dev:api
npm run dev:web
npm run build:api
npm run build:web
```


### Bu adımda taşınanlar

- Yeni `apps/api` tarafında gerçek veritabanı bağlantısı (`pg`) eklendi.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` endpointleri Nest tarafında çalışır hale getirildi.
- Next.js tarafında `/login` sayfası ile yeni auth endpointlerini test edecek istemci formu eklendi.
- Queue altyapısı için `apps/api` tarafına BullMQ + Redis tabanlı `QueueService` eklendi.
- `POST /api/notifications/system-test` endpointi ile bildirim job'ı kuyruğa atılabilir hale geldi.
- Ayrı worker başlangıcı için `npm run worker:api` script'i eklendi.
- Feed modülü Nest tarafına taşındı: `GET /api/feed`, `POST /api/feed`, `POST/DELETE /api/feed/:id/like`, `GET /api/feed/:id/comments`, `POST /api/feed/:id/comment`.
- Next.js tarafına `/feed` test sayfası eklendi.

Legacy Express uygulaması hâlâ çalışır:

```bash
npm run dev:legacy
npm run start:legacy
```

## Legacy Kurulum

### 1. Bağımlılıkları yükle
```bash
npm install
```

### 2. Ortam değişkenlerini ayarla
```bash
cp .env.example .env
# .env dosyasını düzenle
```

### 3. Veritabanını oluştur ve şemayı uygula
`npm run migrate`, kökteki `scripts/migrate.js` dosyasını çalıştırır ve kökteki `schema.sql` şemasını uygular.

```bash
createdb arabalariseviyoruz
npm run migrate
```

İsterseniz aynı akışı manuel olarak da kök dizinden çalıştırabilirsiniz:

```bash
node scripts/migrate.js
```

### 4. Legacy geliştirme sunucusunu başlat
```bash
npm run dev:legacy
```

## API Rotaları (Legacy)

### Auth
| Metod | Rota             | Açıklama        |
|-------|------------------|-----------------|
| POST  | /api/auth/register | Kayıt ol      |
| POST  | /api/auth/login    | Giriş yap     |
| POST  | /api/auth/logout   | Çıkış yap     |
| GET   | /api/auth/me       | Aktif kullanıcı |

### Forum
| Metod  | Rota                           | Açıklama          |
|--------|--------------------------------|-------------------|
| GET    | /api/forum/categories          | Kategoriler       |
| GET    | /api/forum/threads             | Tüm konular       |
| GET    | /api/forum/threads?category=x  | Kategori konuları |
| GET    | /api/forum/threads/:slug       | Konu detayı       |
| POST   | /api/forum/threads             | Konu aç           |
| POST   | /api/forum/threads/:slug/posts | Yanıt yaz         |
| POST   | /api/forum/posts/:id/like      | Beğen             |
| DELETE | /api/forum/posts/:id/like      | Beğeniyi geri al  |

### Akış (Feed)
| Metod | Rota            | Açıklama     |
|-------|-----------------|--------------|
| GET   | /api/feed       | Akışı getir  |
| POST  | /api/feed       | Post paylaş  |
| POST  | /api/feed/:id/like | Beğen     |

### Araçlar
| Metod | Rota          | Açıklama           |
|-------|---------------|--------------------|
| POST  | /api/score    | Alınır mı skoru    |
| GET   | /api/score/stats | İstatistikler   |
