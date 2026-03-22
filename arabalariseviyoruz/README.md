# arabalariseviyoruz.com

Türkiye'nin araba topluluk platformu — Forum + Akış + Araçlar.

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

### 3. Veritabanını oluştur
```bash
createdb arabalariseviyoruz
psql -U postgres -d arabalariseviyoruz -f ../001_initial_schema.sql
```

### 4. Geliştirme sunucusunu başlat
```bash
npm run dev
```

## API Rotaları

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

## Klasör Yapısı

```
arabalariseviyoruz/
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
│   ├── css/
│   ├── js/
│   └── index.html
├── .env.example
└── package.json
```
