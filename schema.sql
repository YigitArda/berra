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

-- Bildirimler
CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type         VARCHAR(50) NOT NULL,
  message      TEXT NOT NULL,
  link         TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kaydedilenler (bookmark)
CREATE TABLE IF NOT EXISTS bookmarks (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, thread_id)
);

-- Akış yorumları
CREATE TABLE IF NOT EXISTS feed_comments (
  id           SERIAL PRIMARY KEY,
  feed_post_id INTEGER NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         VARCHAR(500) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Şikayetler
CREATE TABLE IF NOT EXISTS reports (
  id          SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post','feed_post','feed_comment')),
  target_id   INTEGER NOT NULL,
  reason      VARCHAR(100) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reporter_id, target_type, target_id)
);

-- Ek sütunlar (mevcut veritabanlarına güvenle eklenir)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
  -- Soft delete audit alanları
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  -- Forum yanıt görselleri
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
  -- Akış yorum sayacı
  ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_created ON feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_reviews ON business_reviews (business_id);
-- Ek performans ve sorgu indeksleri
CREATE INDEX IF NOT EXISTS idx_users_banned       ON users (is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_threads_locked     ON threads (is_locked) WHERE is_locked = true;
CREATE INDEX IF NOT EXISTS idx_businesses_status  ON businesses (status);
CREATE INDEX IF NOT EXISTS idx_posts_thread_live  ON posts (thread_id, created_at ASC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_threads_cat_pin    ON threads (category_id, is_pinned DESC, last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments (feed_post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports (status, created_at DESC);

-- Full-text search indexleri (forum araması)
CREATE INDEX IF NOT EXISTS idx_threads_title_fts
  ON threads USING GIN (to_tsvector('simple', COALESCE(title, '')));
CREATE INDEX IF NOT EXISTS idx_posts_body_fts
  ON posts USING GIN (to_tsvector('simple', COALESCE(body, '')))
  WHERE is_deleted = false;

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
