-- arabalariseviyoruz.com — Veritabanı Şeması

-- Kullanıcılar
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(40) UNIQUE NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user',
  is_banned     BOOLEAN NOT NULL DEFAULT false,
  avatar_url    TEXT,
  bio           VARCHAR(300),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forum kategorileri
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Forum konuları
CREATE TABLE IF NOT EXISTS threads (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  slug         VARCHAR(250) UNIQUE NOT NULL,
  is_pinned    BOOLEAN NOT NULL DEFAULT false,
  is_locked    BOOLEAN NOT NULL DEFAULT false,
  view_count   INTEGER NOT NULL DEFAULT 0,
  reply_count  INTEGER NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forum yorumları
CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  thread_id  INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Yorum beğenileri
CREATE TABLE IF NOT EXISTS post_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

-- Akış paylaşımları
CREATE TABLE IF NOT EXISTS feed_posts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       VARCHAR(500) NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Akış beğenileri
CREATE TABLE IF NOT EXISTS feed_likes (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feed_post_id INTEGER NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, feed_post_id)
);

-- Kullanıcı araçları
CREATE TABLE IF NOT EXISTS user_cars (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand      VARCHAR(100) NOT NULL,
  model      VARCHAR(100) NOT NULL,
  year       INTEGER NOT NULL,
  notes      TEXT,
  owned_from INTEGER,
  owned_to   INTEGER,
  is_current BOOLEAN NOT NULL DEFAULT false
);

-- Bakım kayıtları
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id    INTEGER REFERENCES user_cars(id) ON DELETE SET NULL,
  type      VARCHAR(100) NOT NULL,
  done_date DATE NOT NULL,
  done_km   INTEGER,
  next_date DATE,
  next_km   INTEGER,
  note      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rozet tanımları
CREATE TABLE IF NOT EXISTS badge_definitions (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  icon        VARCHAR(10) NOT NULL,
  description TEXT
);

-- Kullanıcı rozetleri
CREATE TABLE IF NOT EXISTS user_badges (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id  INTEGER NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Galeri fotoğrafları
CREATE TABLE IF NOT EXISTS gallery_photos (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id     INTEGER REFERENCES user_cars(id) ON DELETE SET NULL,
  image_url  TEXT NOT NULL,
  caption    VARCHAR(200),
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Galeri beğenileri
CREATE TABLE IF NOT EXISTS gallery_likes (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_id INTEGER NOT NULL REFERENCES gallery_photos(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, photo_id)
);

-- İşletmeler
CREATE TABLE IF NOT EXISTS businesses (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name         VARCHAR(120) NOT NULL,
  slug         VARCHAR(150) UNIQUE NOT NULL,
  category     VARCHAR(100) NOT NULL,
  description  TEXT,
  address      VARCHAR(300) NOT NULL,
  city         VARCHAR(100) NOT NULL,
  district     VARCHAR(100),
  phone        VARCHAR(30),
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  price_range  INTEGER NOT NULL DEFAULT 2,
  open_time    TIME,
  close_time   TIME,
  open_days    VARCHAR(100),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  avg_rating   NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- İşletme yorumları
CREATE TABLE IF NOT EXISTS business_reviews (
  id          SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, user_id)
);

-- Araç skoru
CREATE TABLE IF NOT EXISTS car_scores (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  brand      VARCHAR(100) NOT NULL,
  model      VARCHAR(100) NOT NULL,
  year       INTEGER NOT NULL,
  km         INTEGER NOT NULL,
  price      NUMERIC(12,2) NOT NULL,
  score      NUMERIC(4,2) NOT NULL,
  verdict    VARCHAR(20) NOT NULL,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── İNDEXLER ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_user       ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created    ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_user     ON threads (user_id);
CREATE INDEX IF NOT EXISTS idx_threads_created  ON threads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_slug     ON threads (slug);
CREATE INDEX IF NOT EXISTS idx_feed_user        ON feed_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post  ON post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_feed  ON feed_likes (feed_post_id);
CREATE INDEX IF NOT EXISTS idx_users_username   ON users (username);
CREATE INDEX IF NOT EXISTS idx_car_scores_user  ON car_scores (user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_likes    ON gallery_likes (photo_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_logs (next_date ASC) WHERE next_date IS NOT NULL;

-- ── BAŞLANGIÇ VERİLERİ ────────────────────────────────────────

-- Forum kategorileri
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Genel',           'genel',           1),
  ('Haberler',        'haberler',        2),
  ('Alım-Satım',      'alim-satim',      3),
  ('Teknik',          'teknik',          4),
  ('Modifiye',        'modifiye',        5),
  ('Yarış & Tuning',  'yaris-tuning',    6),
  ('Elektrikli',      'elektrikli',      7),
  ('Sürücü Deneyimi', 'surucu-deneyimi', 8)
ON CONFLICT (slug) DO NOTHING;

-- Rozetler
INSERT INTO badge_definitions (slug, name, icon, description) VALUES
  ('ilk-yorum',    'İlk Adım',       '💬', 'İlk yorumunu yazdın'),
  ('aktif-uye',    'Aktif Üye',      '🔥', '10 yorum yazdın'),
  ('forum-ustasi', 'Forum Ustası',   '⭐', '50 yorum yazdın'),
  ('usta',         'Usta',           '🏆', '100 yorum yazdın'),
  ('ilk-konu',     'Konu Açıcı',     '📝', 'İlk konunu açtın'),
  ('rehber',       'Rehber',         '🗺️', '10 konu açtın'),
  ('arac-sahibi',  'Araç Sahibi',    '🚗', 'Araç ekledin'),
  ('koleksiyoner', 'Koleksiyoner',   '🏎️', '3 veya daha fazla araç'),
  ('fotograf',     'Fotoğrafçı',     '📷', 'Galeri fotoğrafı yükledin'),
  ('populer',      'Popüler',        '❤️', '50 beğeni aldın')
ON CONFLICT (slug) DO NOTHING;
