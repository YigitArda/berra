const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db     = require('../../config/db');

// Token oluştur ve cookie'ye yaz
function issueToken(res, user) {
  const payload = { id: user.id, username: user.username, role: user.role };
  const token   = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 gün (ms)
  });

  return token;
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
    const token = issueToken(res, user);

    return res.status(201).json({
      message: 'Kayıt başarılı.',
      user: { id: user.id, username: user.username, role: user.role },
      token,
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

    const token = issueToken(res, user);

    return res.json({
      message: 'Giriş başarılı.',
      user: { id: user.id, username: user.username, role: user.role },
      token,
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie('token');
  return res.json({ message: 'Çıkış yapıldı.' });
}

// POST /api/auth/refresh — mevcut token geçerliyse yeni token ver
async function refresh(req, res) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token bulunamadı.' });

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

    const newToken = issueToken(res, rows[0]);
    return res.json({ message: 'Token yenilendi.', token: newToken });
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
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

module.exports = { register, login, logout, me, refresh };
