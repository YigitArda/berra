const jwt = require('jsonwebtoken');
const db  = require('../../config/db');

// JWT doğrulama — zorunlu (ban kontrolü dahil)
async function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Ban kontrolü
    const { rows } = await db.query('SELECT is_banned FROM users WHERE id = $1', [decoded.id]);
    if (!rows.length || rows[0].is_banned) {
      res.clearCookie('token');
      return res.status(403).json({ error: 'Hesabınız askıya alınmış.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
}

// JWT doğrulama — opsiyonel (misafir de geçebilir)
function optionalAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// Sadece admin/mod geçebilir
function requireMod(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
  }
  if (!['mod', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireMod };
