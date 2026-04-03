const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db     = require('../../config/db');
const {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_MAX_AGE_MS,
  buildCookieOptions,
} = require('../utils/authCookies');

// Token oluştur ve sadece httpOnly cookie'ye yaz
function issueToken(res, user) {
  const payload = { id: user.id, username: user.username, role: user.role };
  const token   = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.cookie(ACCESS_COOKIE_NAME, token, buildCookieOptions(ACCESS_COOKIE_MAX_AGE_MS));
}

// POST /api/auth/register
async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Tekrar eden kullanıcı kontrolü
    const exists = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1',
      [email.toLowerCase(), username]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Bu email veya kullanıcı adı zaten kayıtlı.' });
    }

    const hash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, role, created_at`,
      [username, email.toLowerCase(), hash]
    );

    const user  = rows[0];
    issueToken(res, user);

    return res.status(201).json({
      message: 'Kayıt başarılı.',
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const { rows } = await db.query(
      'SELECT id, username, email, password_hash, role, is_banned FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email veya şifre hatalı.' });
    }

    const user = rows[0];

    if (user.is_banned) {
      return res.status(403).json({ error: 'Hesabınız askıya alınmış.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Email veya şifre hatalı.' });
    }

    issueToken(res, user);

    return res.json({
      message: 'Giriş başarılı.',
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie(ACCESS_COOKIE_NAME, buildCookieOptions());
  return res.json({ message: 'Çıkış yapıldı.' });
}

// POST /api/auth/refresh — mevcut token geçerliyse yeni token ver
async function refresh(req, res) {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Oturum çerezi bulunamadı.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcının hâlâ aktif olduğunu DB'den kontrol et
    const { rows } = await db.query(
      'SELECT id, username, role, is_banned FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows.length || rows[0].is_banned) {
      return res.status(401).json({ error: 'Geçersiz oturum.' });
    }

    issueToken(res, rows[0]);
    return res.json({ message: 'Oturum yenilendi.' });
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const { rows } = await db.query(
      'SELECT id, username, email, role, avatar_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/auth/forgot-password — şifre sıfırlama token'ı oluştur
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(422).json({ error: 'Email gerekli.' });

  try {
    const { rows } = await db.query('SELECT id, username FROM users WHERE email = $1', [email.toLowerCase()]);
    // Güvenlik: kullanıcı olsun olmasın aynı mesajı ver
    if (!rows.length) return res.json({ message: 'Eğer bu email kayıtlıysa, sıfırlama kodu oluşturuldu.' });

    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetExpiry, rows[0].id]
    );

    // Not: Gerçek mail gönderimi için nodemailer vb. gerekir
    // Şimdilik token'ı döndürüyoruz (production'da mail gönderilir)
    return res.json({
      message: 'Sıfırlama kodu oluşturuldu.',
      // Production'da bu satır kaldırılacak — sadece dev için:
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    });
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/auth/reset-password — yeni şifre belirle
async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(422).json({ error: 'Token ve yeni şifre gerekli.' });
  if (password.length < 6) return res.status(422).json({ error: 'Şifre en az 6 karakter olmalı.' });

  try {
    const { rows } = await db.query(
      'SELECT id, username, role FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş sıfırlama kodu.' });

    const hash = await bcrypt.hash(password, 12);
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hash, rows[0].id]
    );

    issueToken(res, rows[0]);
    return res.json({ message: 'Şifre değiştirildi. Otomatik giriş yapıldı.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = { register, login, logout, me, refresh, forgotPassword, resetPassword };
