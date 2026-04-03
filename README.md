# arabalariseviyoruz.com

Türkiye'nin araba topluluk platformu — Forum + Akış + Araçlar.

> **Not:** Aktif uygulama depo kökünde yer alır. `package.json`, `scripts/migrate.js` ve `schema.sql` dosyaları bu kök dizin için kanonik kaynaktır; yanlışlıkla alt klasörlerde çalışmayın.

## Kurulum

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

### 4. Geliştirme sunucusunu başlat
```bash
npm run dev
```

## API Rotaları

### Auth
Auth akışı **cookie tabanlıdır**. `register`, `login`, `refresh`, `reset-password` endpoint'leri
token'ı JSON response gövdesinde döndürmez; sadece `httpOnly` cookie (`token`) set eder.

Frontend isteklerinde `Authorization: Bearer ...` yerine `fetch(..., { credentials: 'include' })`
kullanılmalıdır.

| Metod | Rota                   | Açıklama |
|------|------------------------|----------|
| POST | /api/auth/register     | Kayıt olur, oturum cookie'si set edilir |
| POST | /api/auth/login        | Giriş yapar, oturum cookie'si set edilir |
| POST | /api/auth/refresh      | Geçerli cookie ile oturumu yeniler (response'ta token yok) |
| POST | /api/auth/logout       | Oturum cookie'sini temizler |
| POST | /api/auth/forgot-password | Şifre sıfırlama kodu oluşturur |
| POST | /api/auth/reset-password  | Şifreyi sıfırlar, yeni oturum cookie'si set eder |
| GET  | /api/auth/me           | Aktif kullanıcı |

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

## Klasör Yapısı

```text
.
├── src/
│   ├── app.js               # Express giriş noktası
│   ├── routes/
│   │   ├── auth.js          # Giriş / kayıt
│   │   ├── forum.js         # Forum
│   │   ├── feed.js          # Akış
│   │   └── score.js         # Alınır mı skoru
│   ├── controllers/
│   │   └── authController.js
│   └── middleware/
│       └── auth.js          # JWT doğrulama
├── config/
│   └── db.js                # PostgreSQL bağlantısı
├── public/                  # Frontend dosyaları
├── scripts/
│   └── migrate.js           # schema.sql dosyasını uygular
├── schema.sql               # Veritabanı şeması
├── .env.example
└── package.json
```
