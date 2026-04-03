require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const compression  = require('compression');
const path         = require('path');
const { sanitizeBody } = require('./middleware/sanitize');
const { legacyRedirects } = require('./middleware/legacyRedirects');

const app = express();

// ── Proxy güveni (Railway / Nginx arkasında doğru IP için) ───
app.set('trust proxy', 1);

// ── Gzip sıkıştırma ──────────────────────────────────────────
app.use(compression());

// ── Güvenlik middleware ──────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP'yi nginx ile yönet
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek. Lütfen bekleyin.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // giriş/kayıt için daha sıkı
  message: { error: 'Çok fazla deneme. 15 dakika bekleyin.' },
});

app.use(limiter);

// ── Body parser ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeBody);

// ── Legacy -> Next kalıcı yönlendirme planı (opsiyonel) ───────
const activeUi = (process.env.ACTIVE_UI || 'legacy').toLowerCase();
const nextAppUrl = (process.env.NEXT_APP_URL || process.env.APP_URL || '').replace(/\/$/, '');

if (activeUi === 'next' && nextAppUrl) {
  const permanentRedirects = [
    { from: /^\/index\.html$/, to: () => '/' },
    { from: /^\/post\/([^/]+)\/?$/, to: ({ params }) => `/items/${params[0]}` },
  ];

  app.use((req, res, next) => {
    const hit = permanentRedirects.find((route) => route.from.test(req.path));
    if (!hit) return next();

    const match = req.path.match(hit.from);
    const targetPath = hit.to({ params: match?.slice(1) || [] });
    return res.redirect(301, `${nextAppUrl}${targetPath}`);
  });
}

// ── Statik dosyalar ──────────────────────────────────────────
app.use(legacyRedirects);
app.use(express.static(path.join(__dirname, '../public')));

// ── API rotaları ─────────────────────────────────────────────
app.use('/api/auth',  authLimiter, require('./routes/auth'));
app.use('/api/forum',             require('./routes/forum'));
app.use('/api/feed',              require('./routes/feed'));
app.use('/api/score',             require('./routes/score'));
app.use('/api/profile',           require('./routes/profile'));
app.use('/api/search',            require('./routes/search'));
app.use('/api/businesses',         require('./routes/businesses'));
app.use('/api/maintenance',         require('./routes/maintenance').router);
app.use('/api/preview',           require('./routes/preview'));
app.use('/api/notifications',    require('./routes/notifications').router);
app.use('/api/bookmarks',        require('./routes/bookmarks'));
app.use('/api/admin',            require('./routes/admin'));
app.use('/api/reports',          require('./routes/reports'));
app.use('/api/discovery',        require('./routes/discovery'));

// ── Sağlık kontrolü ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── Sitemap ──────────────────────────────────────────────────
app.get('/sitemap.xml', async (req, res) => {
  const db = require('../config/db');
  const base = process.env.APP_URL || 'https://arabalariseviyoruz.com';
  try {
    const { rows } = await db.query(
      `SELECT slug, created_at FROM threads ORDER BY created_at DESC LIMIT 1000`
    );
    const urls = [
      `<url><loc>${base}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${base}/rehber.html</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
      `<url><loc>${base}/sanayi.html</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      `<url><loc>${base}/karsilastir.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
      ...rows.map(r =>
        `<url><loc>${base}/thread/${r.slug}</loc><lastmod>${new Date(r.created_at).toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`
      ),
    ].join('\n  ');
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls}\n</urlset>`);
  } catch (err) {
    res.status(500).send('Sitemap oluşturulamadı.');
  }
});

// ── 404 handler (API rotaları için) ──────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı.' });
});

// ── SPA fallback (frontend route'ları için) ──────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Hata yakalayıcı ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Beklenmeyen bir hata oluştu.' });
});

// ── Sunucuyu başlat ──────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`\n🚗 arabalariseviyoruz.com çalışıyor → http://localhost:${PORT}`);
  console.log(`   Ortam : ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
