require('dotenv').config();

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const app = express();

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

// ── Statik dosyalar ──────────────────────────────────────────
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

// ── Sağlık kontrolü ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
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
