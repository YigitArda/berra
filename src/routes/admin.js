const express = require('express');
const router  = express.Router();
const db      = require('../../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// PUT /api/admin/users/:id/role — kullanıcının rolünü değiştir (sadece admin)
router.put('/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'mod', 'admin'].includes(role)) {
    return res.status(422).json({ error: 'Geçersiz rol. user / mod / admin olmalı.' });
  }
  const userId = parseInt(req.params.id);
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Kendi rolünüzü değiştiremezsiniz.' });
  }
  try {
    const { rows } = await db.query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, role`,
      [role, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    res.json({ message: 'Rol güncellendi.', user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// PUT /api/admin/users/:id/ban — kullanıcıyı banla / ban kaldır (mod + admin)
router.put('/users/:id/ban', requireAuth, async (req, res) => {
  if (!['mod', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
  }
  const userId = parseInt(req.params.id);
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Kendinizi banlayamazsınız.' });
  }
  const { banned } = req.body; // true / false
  try {
    const { rows } = await db.query(
      `UPDATE users SET is_banned = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, is_banned`,
      [!!banned, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    res.json({ message: banned ? 'Kullanıcı banlandı.' : 'Ban kaldırıldı.', user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// GET /api/admin/users — kullanıcı listesi (arama ile)
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  const { q, page = 1 } = req.query;
  const limit  = 30;
  const offset = (Math.max(parseInt(page), 1) - 1) * limit;
  let where  = '';
  const params = [limit, offset];
  if (q) {
    params.push(`%${q}%`);
    where = `WHERE username ILIKE $${params.length} OR email ILIKE $${params.length}`;
  }
  try {
    const { rows } = await db.query(
      `SELECT id, username, email, role, is_banned, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params
    );
    const total = await db.query(`SELECT COUNT(*) FROM users ${where}`, params.slice(2));
    res.json({ users: rows, total: parseInt(total.rows[0].count), page: parseInt(page), limit });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
