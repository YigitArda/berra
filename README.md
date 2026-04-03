# arabalariseviyoruz.com

Türkiye'nin araba topluluk platformu — Forum + Akış + Araçlar.

> **Not:** Aktif legacy uygulama depo kökünde yer alır. `package.json`, `scripts/migrate.js` ve `schema.sql` dosyaları bu kök dizin için kanonik kaynaktır; yanlışlıkla alt klasörlerde çalışmayın.


## Aktif kullanıcı arayüzü

- **Production hedefi:** Next.js (`apps/web`) tam geçiş.
- **Legacy arayüz:** `ACTIVE_UI=legacy` verilirse geri dönüş (rollback) amaçlı kullanılabilir (varsayılan artık `next`).

### Geliştirme komutları (arayüze göre)

**Legacy arayüzü geliştirme (aktif):**

```bash
npm run dev:legacy
npm run start:legacy
```

**Next arayüzü geliştirme (migration):**

```bash
npm run dev:web
npm run build:web
```

## Route matrisi (Next vs Legacy)

| URL pattern | Legacy (`public/`) | Next (`apps/web`) | Durum |
|---|---|---|---|
| `/` | ✅ `index.html` / SPA ana ekran | ✅ `app/page.tsx` | İki arayüzde de var |
| `/index.html` | ✅ statik giriş | ✅ `/`'e redirect | Next tarafında kalıcı yönlendirme var |
| `/login` | ⚠️ modal/SPA akışı | ✅ `app/login/page.tsx` | Next karşılığı hazır |
| `/register` | ⚠️ modal/SPA akışı | ✅ `app/register/page.tsx` | Next karşılığı hazır |
| `/feed` | ⚠️ SPA içinde feed paneli | ✅ `app/feed/page.tsx` | Next karşılığı hazır |
| `/search` | ⚠️ navbar içi arama | ✅ `app/search/page.tsx` | Next karşılığı hazır |
| `/notifications` | ⚠️ SPA panel | ✅ `app/notifications/page.tsx` | Next karşılığı hazır |
| `/dashboard` | ❌ ayrı route yok | ✅ `app/dashboard/page.tsx` | Sadece Next |
| `/post/:id` | ✅ SPA post detail route | ✅ `/items/:id` (`app/items/[id]/page.tsx`) | Kalıcı yönlendirme planlandı |
| `/thread/:slug` | ✅ SPA thread route | ✅ `app/thread/[slug]/page.tsx` | Next karşılığı hazır |
| `/profile/:username` | ✅ SPA profile route | ✅ `app/profile/[username]/page.tsx` | Next karşılığı hazır |
| `/messages` , `/messages/:username` | ✅ SPA messages route | ✅ `app/messages/*` | Next karşılığı hazır |
| `/rehber.html` | ✅ statik sayfa | ✅ `/rehber` | Next karşılığı hazır (yeni URL) |
| `/sanayi.html` | ✅ statik sayfa | ✅ `/sanayi` | Next karşılığı hazır (yeni URL) |
| `/karsilastir.html` | ✅ statik sayfa | ✅ `/karsilastir` | Next karşılığı hazır (yeni URL) |
| `/ozellikler.html` | ✅ statik sayfa | ✅ `/ozellikler` | Next karşılığı hazır (yeni URL) |

## API sahiplik durumu (Next cutover)

Next frontend tarafında kullanılan endpointler Nest API üzerinde çalışır:

- `auth`, `feed`, `profile`, `search`, `notifications`
- `forum`, `discovery`, `businesses`, `bookmarks`, `reports`

Detay endpoint envanteri ve taşınma kararları: `docs/next-cutover-api-matrix.md`.

## Legacy -> Next kalıcı redirect planı

- Legacy Express katmanında `ACTIVE_UI=next` ve `NEXT_APP_URL` tanımlıysa kullanıcı-facing route'lar Next'e `301` ile yönlendirilir
  (örn: `/`, `/feed`, `/search`, `/notifications`, `/forum`, `/thread/:slug`, `/profile/:username`, `/models`, `/rehber.html`, `/sanayi.html`, `/karsilastir.html`, `/post/:id`).
- Rollback için `ACTIVE_UI=legacy` kullanılabilir.

## Auth/session cookie kuralları (Legacy + Next için sabit)

Her iki backend'de de cookie politikası hizalandı:

- Access cookie adı: `token`
- Refresh cookie adı: `refresh_token`
- `httpOnly: true`
- `sameSite: lax`
- `secure: NODE_ENV=production`
- `path: /`
- Access maxAge: **15 dakika**
- Refresh maxAge: **14 gün**


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
- Auth yanıtları cookie-odaklı hale getirildi; JWT artık response body'de dönülmüyor.
- API'de global exception formatı ve env doğrulaması eklendi.
- Auth tarafına `POST /api/auth/refresh` eklendi; rol bazlı yetki için `RolesGuard` altyapısı kuruldu.
- Profil modülü eklendi: `GET /api/profile/me`, `PUT /api/profile/me`, `GET /api/profile/:username`.
- Arama modülü eklendi: `GET /api/search?q=...` (PostgreSQL FTS).
- Realtime bildirim altyapısı eklendi (`Socket.IO gateway`) ve bildirim yayınlama entegre edildi.
- API için temel e2e test iskeleti eklendi (`apps/api/test/health.e2e-spec.ts`).

Legacy Express uygulaması hâlâ çalışır:

```bash
npm run dev:legacy
npm run start:legacy
```


## Monorepo Yapısı (pnpm + Turbo)

Repo, `pnpm-workspace.yaml` + `turbo.json` ile monorepo düzenine taşındı:

- `apps/api` (NestJS + Fastify)
- `apps/web` (Next.js App Router)
- `packages/shared` (types + zod şemaları + utils)

### Temel komutlar

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
```

## Ortak Standartlar

- ESLint + Prettier
- Husky + lint-staged
- Conventional Commits (commitlint)
- `.env.example` + runtime env validation

## Local Docker Compose

`docker-compose.local.yml` ile aşağıdaki servisler birlikte ayağa kalkar:

- postgres
- redis
- api
- web

```bash
docker compose -f docker-compose.local.yml up --build
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
| GET    | /api/forum/threads?tag=x       | Etikete göre konular |
| GET    | /api/forum/threads/:slug       | Konu detayı       |
| POST   | /api/forum/threads             | Konu aç           |
| POST   | /api/forum/threads/:slug/posts | Yanıt yaz         |
| POST   | /api/forum/posts/:id/like      | Beğen             |
| DELETE | /api/forum/posts/:id/like      | Beğeniyi geri al  |
| GET    | /api/forum/tags                | Popüler etiketler |

### Discovery (Takip + Model Merkezi)
| Metod  | Rota                                | Açıklama                     |
|--------|-------------------------------------|------------------------------|
| POST   | /api/discovery/users/:userId/follow | Kullanıcı takip et           |
| DELETE | /api/discovery/users/:userId/follow | Kullanıcı takibini bırak     |
| POST   | /api/discovery/threads/:threadId/follow | Thread takip et          |
| DELETE | /api/discovery/threads/:threadId/follow | Thread takibini bırak    |
| POST   | /api/discovery/models               | Marka/model kaydı aç         |
| GET    | /api/discovery/models               | Model listesi                |
| GET    | /api/discovery/models/:slug         | Model landing verisi         |
| POST   | /api/discovery/models/:modelId/follow | Model takip et             |
| DELETE | /api/discovery/models/:modelId/follow | Model takibini bırak      |

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


## Staging Altyapısı

Bu repoda staging için temel deploy altyapısı eklendi:

- `docker-compose.staging.yml`: Postgres + Redis + API + Worker + Web servisleri
- `apps/api/Dockerfile`, `apps/web/Dockerfile`: üretim imajı build dosyaları
- `deploy/k8s/*`: namespace/deployment/service/ingress manifestleri
- `.github/workflows/staging.yml`: staging build/doğrulama workflow
- `.github/workflows/cd-staging.yml`: staging deploy workflow (image push + migration + rollout)
- `.env.staging.example`: staging ortam değişken örneği

### Local staging smoke

```bash
docker compose -f docker-compose.staging.yml up --build
```

### K8s apply

```bash
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/api-deployment.yaml
kubectl apply -f deploy/k8s/web-deployment.yaml
kubectl apply -f deploy/k8s/worker-deployment.yaml
kubectl apply -f deploy/k8s/db-migrate-job.yaml
kubectl apply -f deploy/k8s/ingress.yaml
```

### CI/CD özeti

- CI: `/.github/workflows/staging.yml` (lint + typecheck + test + migration check + image/compose doğrulama)
- CD: `/.github/workflows/cd-staging.yml` (staging deploy + db migration + rollout)
- Secret yönetimi: `deploy/SECRETS.md`
- Rollback planı: `deploy/ROLLBACK.md`


## Backend Foundation (2.x)

### 2.1 Core

NestJS modülleri:

- auth
- users
- content
- notifications
- search
- realtime
- jobs

Global:

- ValidationPipe
- ExceptionFilter
- Request logging (pino-http middleware)
- ConfigModule

### 2.2 Auth

- JWT access + refresh (ayrı cookie)
- Password hashing (bcrypt)
- RBAC (Roles decorator + RolesGuard)
- Session/device token tablosu (`user_sessions`)

### 2.3 DB (PostgreSQL + Prisma)

Prisma schema (`apps/api/prisma/schema.prisma`) model kapsamı:

- User
- Profile
- Content
- Notification
- Activity
- Session

Pipeline:

```bash
pnpm --filter @berra/api run prisma:generate
pnpm --filter @berra/api run prisma:migrate
pnpm --filter @berra/api run prisma:seed
```


### Nixpacks / PNPM Lockfile Notu

`pnpm-lock.yaml` olmadığında CI/build tarafında `--frozen-lockfile` hatası alınmaması için
repo kökünde `nixpacks.toml` ile install komutu `pnpm i --no-frozen-lockfile` olarak override edilmiştir.
