# arabalariseviyoruz.com

TÃ¼rkiye'nin araba topluluk platformu â€” Forum + AkÄ±ÅŸ + AraÃ§lar.

> **Not:** Aktif legacy uygulama depo kÃ¶kÃ¼nde yer alÄ±r. `package.json`, `scripts/migrate.js` ve `schema.sql` dosyalarÄ± bu kÃ¶k dizin iÃ§in kanonik kaynaktÄ±r; yanlÄ±ÅŸlÄ±kla alt klasÃ¶rlerde Ã§alÄ±ÅŸmayÄ±n.

## Aktif kullanÄ±cÄ± arayÃ¼zÃ¼

- **Production hedefi:** Next.js (`apps/web`) tam geÃ§iÅŸ.
- **Legacy arayÃ¼z:** `ACTIVE_UI=legacy` verilirse geri dÃ¶nÃ¼ÅŸ (rollback) amaÃ§lÄ± kullanÄ±labilir (varsayÄ±lan artÄ±k `next`).

### GeliÅŸtirme komutlarÄ± (arayÃ¼ze gÃ¶re)

**Legacy arayÃ¼zÃ¼ geliÅŸtirme (aktif):**

```bash
npm run dev:legacy
npm run start:legacy
```

**Next arayÃ¼zÃ¼ geliÅŸtirme (migration):**

```bash
npm run dev:web
npm run build:web
```

## Route matrisi (Next vs Legacy)

| URL pattern                         | Legacy (`public/`)               | Next (`apps/web`)                            | Durum                                     |
| ----------------------------------- | -------------------------------- | -------------------------------------------- | ----------------------------------------- |
| `/`                                 | âœ… `index.html` / SPA ana ekran | âœ… `app/page.tsx`                           | Ä°ki arayÃ¼zde de var                     |
| `/index.html`                       | âœ… statik giriÅŸ                | âœ… `/`'e redirect                           | Next tarafÄ±nda kalÄ±cÄ± yÃ¶nlendirme var |
| `/login`                            | âš ï¸ modal/SPA akÄ±ÅŸÄ±         | âœ… `app/login/page.tsx`                     | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r                |
| `/register`                         | âš ï¸ modal/SPA akÄ±ÅŸÄ±         | âœ… `app/register/page.tsx`                  | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r                |
| `/feed`                             | âš ï¸ SPA iÃ§inde feed paneli    | âœ… `app/feed/page.tsx`                      | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r                |
| `/search`                           | âš ï¸ navbar iÃ§i arama          | âœ… `app/search/page.tsx`                    | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r                |
| `/notifications`                    | âš ï¸ SPA panel                  | âœ… `app/notifications/page.tsx`             | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r                |
| `/dashboard`                        | âŒ ayrÄ± route yok               | âœ… `app/dashboard/page.tsx`                 | Sadece Next                               |
| `/post/:id`                         | âœ… SPA post detail route        | âœ… `/items/:id` (`app/items/[id]/page.tsx`) | KalÄ±cÄ± yÃ¶nlendirme planlandÄ±          |
| `/thread/:slug`                     | âœ… SPA thread route             | âœ… `app/thread/[slug]/page.tsx`             | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r                |
| `/profile/:username`                | âœ… SPA profile route            | âœ… `app/profile/[username]/page.tsx`        | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r                |
| `/messages` , `/messages/:username` | âœ… SPA messages route           | âœ… `app/messages/*`                         | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r                |
| `/rehber.html`                      | âœ… statik sayfa                 | âœ… `/rehber`                                | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r (yeni URL)     |
| `/sanayi.html`                      | âœ… statik sayfa                 | âœ… `/sanayi`                                | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r (yeni URL)     |
| `/karsilastir.html`                 | âœ… statik sayfa                 | âœ… `/karsilastir`                           | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r (yeni URL)     |
| `/ozellikler.html`                  | âœ… statik sayfa                 | âœ… `/ozellikler`                            | Next karÅŸÄ±lÄ±ÄŸÄ± hazÄ±r (yeni URL)     |

## API sahiplik durumu (Next cutover)

Next frontend tarafÄ±nda kullanÄ±lan endpointler Nest API Ã¼zerinde Ã§alÄ±ÅŸÄ±r:

- `auth`, `feed`, `profile`, `search`, `notifications`
- `forum`, `discovery`, `businesses`, `bookmarks`, `reports`

Detay endpoint envanteri ve taÅŸÄ±nma kararlarÄ±: `docs/next-cutover-api-matrix.md`.

## Legacy -> Next kalÄ±cÄ± redirect planÄ±

- Legacy Express katmanÄ±nda `ACTIVE_UI=next` ve `NEXT_APP_URL` tanÄ±mlÄ±ysa kullanÄ±cÄ±-facing route'lar Next'e `301` ile yÃ¶nlendirilir
  (Ã¶rn: `/`, `/feed`, `/search`, `/notifications`, `/forum`, `/thread/:slug`, `/profile/:username`, `/models`, `/rehber.html`, `/sanayi.html`, `/karsilastir.html`, `/post/:id`).
- Rollback iÃ§in `ACTIVE_UI=legacy` kullanÄ±labilir.

## Auth/session cookie kurallarÄ± (Legacy + Next iÃ§in sabit)

Her iki backend'de de cookie politikasÄ± hizalandÄ±:

- Access cookie adÄ±: `token`
- Refresh cookie adÄ±: `refresh_token`
- `httpOnly: true`
- `sameSite: lax`
- `secure: NODE_ENV=production`
- `path: /`
- Access maxAge: **15 dakika**
- Refresh maxAge: **14 gÃ¼n**

## Yeni Mimari (Migration BaÅŸlangÄ±cÄ±)

Bu repo yeni mimari geÃ§iÅŸi iÃ§in aÅŸaÄŸÄ±daki baÅŸlangÄ±Ã§ yapÄ±sÄ±nÄ± iÃ§erir:

- `apps/api`: NestJS + Fastify + TypeScript (yeni API iskeleti)
- `apps/web`: Next.js + TypeScript (yeni frontend iskeleti)
- `packages/shared`: paylaÅŸÄ±lan tipler (DTO/type contract)

### Yeni komutlar

```bash
npm run dev:api
npm run dev:web
npm run build:api
npm run build:web
```

### Bu adÄ±mda taÅŸÄ±nanlar

- Yeni `apps/api` tarafÄ±nda gerÃ§ek veritabanÄ± baÄŸlantÄ±sÄ± (`pg`) eklendi.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` endpointleri Nest tarafÄ±nda Ã§alÄ±ÅŸÄ±r hale getirildi.
- Next.js tarafÄ±nda `/login` sayfasÄ± ile yeni auth endpointlerini test edecek istemci formu eklendi.
- Queue altyapÄ±sÄ± iÃ§in `apps/api` tarafÄ±na BullMQ + Redis tabanlÄ± `QueueService` eklendi.
- `POST /api/notifications/system-test` endpointi ile bildirim job'Ä± kuyruÄŸa atÄ±labilir hale geldi.
- AyrÄ± worker baÅŸlangÄ±cÄ± iÃ§in `npm run worker:api` script'i eklendi.
- Feed modÃ¼lÃ¼ Nest tarafÄ±na taÅŸÄ±ndÄ±: `GET /api/feed`, `POST /api/feed`, `POST/DELETE /api/feed/:id/like`, `GET /api/feed/:id/comments`, `POST /api/feed/:id/comment`.
- Next.js tarafÄ±na `/feed` test sayfasÄ± eklendi.
- Auth yanÄ±tlarÄ± cookie-odaklÄ± hale getirildi; JWT artÄ±k response body'de dÃ¶nÃ¼lmÃ¼yor.
- API'de global exception formatÄ± ve env doÄŸrulamasÄ± eklendi.
- Auth tarafÄ±na `POST /api/auth/refresh` eklendi; rol bazlÄ± yetki iÃ§in `RolesGuard` altyapÄ±sÄ± kuruldu.
- Profil modÃ¼lÃ¼ eklendi: `GET /api/profile/me`, `PUT /api/profile/me`, `GET /api/profile/:username`.
- Arama modÃ¼lÃ¼ eklendi: `GET /api/search?q=...` (PostgreSQL FTS).
- Realtime bildirim altyapÄ±sÄ± eklendi (`Socket.IO gateway`) ve bildirim yayÄ±nlama entegre edildi.
- API iÃ§in temel e2e test iskeleti eklendi (`apps/api/test/health.e2e-spec.ts`).

Legacy Express uygulamasÄ± hÃ¢lÃ¢ Ã§alÄ±ÅŸÄ±r:

```bash
npm run dev:legacy
npm run start:legacy
```

## Monorepo YapÄ±sÄ± (pnpm + Turbo)

Repo, `pnpm-workspace.yaml` + `turbo.json` ile monorepo dÃ¼zenine taÅŸÄ±ndÄ±:

- `apps/api` (NestJS + Fastify)
- `apps/web` (Next.js App Router)
- `packages/shared` (types + zod ÅŸemalarÄ± + utils)

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

`docker-compose.local.yml` ile aÅŸaÄŸÄ±daki servisler birlikte ayaÄŸa kalkar:

- postgres
- redis
- api
- web

```bash
docker compose -f docker-compose.local.yml up --build
```

## Legacy Kurulum

### 1. BaÄŸÄ±mlÄ±lÄ±klarÄ± yÃ¼kle

```bash
npm install
```

### 2. Ortam deÄŸiÅŸkenlerini ayarla

```bash
cp .env.example .env
# .env dosyasÄ±nÄ± dÃ¼zenle
```

### 3. VeritabanÄ±nÄ± oluÅŸtur ve ÅŸemayÄ± uygula

`npm run migrate`, kÃ¶kteki `scripts/migrate.js` dosyasÄ±nÄ± Ã§alÄ±ÅŸtÄ±rÄ±r ve kÃ¶kteki `schema.sql` ÅŸemasÄ±nÄ± uygular.

```bash
createdb arabalariseviyoruz
npm run migrate
```

Ä°sterseniz aynÄ± akÄ±ÅŸÄ± manuel olarak da kÃ¶k dizinden Ã§alÄ±ÅŸtÄ±rabilirsiniz:

```bash
node scripts/migrate.js
```

### 4. Legacy geliÅŸtirme sunucusunu baÅŸlat

```bash
npm run dev:legacy
```

## API RotalarÄ± (Legacy)

### Auth

| Metod | Rota               | AÃ§Ä±klama        |
| ----- | ------------------ | ----------------- |
| POST  | /api/auth/register | KayÄ±t ol         |
| POST  | /api/auth/login    | GiriÅŸ yap        |
| POST  | /api/auth/logout   | Ã‡Ä±kÄ±ÅŸ yap     |
| GET   | /api/auth/me       | Aktif kullanÄ±cÄ± |

### Forum

| Metod  | Rota                           | AÃ§Ä±klama            |
| ------ | ------------------------------ | --------------------- |
| GET    | /api/forum/categories          | Kategoriler           |
| GET    | /api/forum/threads             | TÃ¼m konular          |
| GET    | /api/forum/threads?category=x  | Kategori konularÄ±    |
| GET    | /api/forum/threads?tag=x       | Etikete gÃ¶re konular |
| GET    | /api/forum/threads/:slug       | Konu detayÄ±          |
| POST   | /api/forum/threads             | Konu aÃ§              |
| POST   | /api/forum/threads/:slug/posts | YanÄ±t yaz            |
| POST   | /api/forum/posts/:id/like      | BeÄŸen                |
| DELETE | /api/forum/posts/:id/like      | BeÄŸeniyi geri al     |
| GET    | /api/forum/tags                | PopÃ¼ler etiketler    |

### Discovery (Takip + Model Merkezi)

| Metod  | Rota                                    | AÃ§Ä±klama                  |
| ------ | --------------------------------------- | --------------------------- |
| POST   | /api/discovery/users/:userId/follow     | KullanÄ±cÄ± takip et        |
| DELETE | /api/discovery/users/:userId/follow     | KullanÄ±cÄ± takibini bÄ±rak |
| POST   | /api/discovery/threads/:threadId/follow | Thread takip et             |
| DELETE | /api/discovery/threads/:threadId/follow | Thread takibini bÄ±rak      |
| POST   | /api/discovery/models                   | Marka/model kaydÄ± aÃ§      |
| GET    | /api/discovery/models                   | Model listesi               |
| GET    | /api/discovery/models/:slug             | Model landing verisi        |
| POST   | /api/discovery/models/:modelId/follow   | Model takip et              |
| DELETE | /api/discovery/models/:modelId/follow   | Model takibini bÄ±rak       |

### AkÄ±ÅŸ (Feed)

| Metod | Rota               | AÃ§Ä±klama     |
| ----- | ------------------ | -------------- |
| GET   | /api/feed          | AkÄ±ÅŸÄ± getir |
| POST  | /api/feed          | Post paylaÅŸ   |
| POST  | /api/feed/:id/like | BeÄŸen         |

### AraÃ§lar

| Metod | Rota             | AÃ§Ä±klama         |
| ----- | ---------------- | ------------------ |
| POST  | /api/score       | AlÄ±nÄ±r mÄ± skoru |
| GET   | /api/score/stats | Ä°statistikler     |

## Staging AltyapÄ±sÄ±

Bu repoda staging iÃ§in temel deploy altyapÄ±sÄ± eklendi:

- `docker-compose.staging.yml`: Postgres + Redis + API + Worker + Web servisleri
- `apps/api/Dockerfile`, `apps/web/Dockerfile`: Ã¼retim imajÄ± build dosyalarÄ±
- `deploy/k8s/*`: namespace/deployment/service/ingress manifestleri
- `.github/workflows/staging.yml`: staging build/doÄŸrulama workflow
- `.github/workflows/cd-staging.yml`: staging deploy workflow (image push + migration + rollout)
- `.env.staging.example`: staging ortam deÄŸiÅŸken Ã¶rneÄŸi

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

### CI/CD Ã¶zeti

- CI: `/.github/workflows/staging.yml` (lint + typecheck + test + migration check + image/compose doÄŸrulama)
- CD: `/.github/workflows/cd-staging.yml` (staging deploy + db migration + rollout)
- Secret yÃ¶netimi: `deploy/SECRETS.md`
- Rollback planÄ±: `deploy/ROLLBACK.md`

## Backend Foundation (2.x)

### 2.1 Core

NestJS modÃ¼lleri:

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

- JWT access + refresh (ayrÄ± cookie)
- Password hashing (bcrypt)
- RBAC (Roles decorator + RolesGuard)
- Session/device token tablosu (`user_sessions`)

### 2.3 DB (PostgreSQL + Prisma)

Prisma schema (`apps/api/prisma/schema.prisma`) model kapsamÄ±:

- User
- Profile
- Content
- Notification
- Activity
- Session

Pipeline:

```bash
pnpm --filter @araba/api run prisma:generate
pnpm --filter @araba/api run prisma:migrate
pnpm --filter @araba/api run prisma:seed
```

### Nixpacks / PNPM Lockfile Notu

`pnpm-lock.yaml` olmadÄ±ÄŸÄ±nda CI/build tarafÄ±nda `--frozen-lockfile` hatasÄ± alÄ±nmamasÄ± iÃ§in
repo kÃ¶kÃ¼nde `nixpacks.toml` ile install komutu `pnpm i --no-frozen-lockfile` olarak override edilmiÅŸtir.
