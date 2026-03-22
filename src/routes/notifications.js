const express = require('express');
const router  = express.Router();
const db      = require('../../config/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/notifications — kullanıcının bildirimleri
router.get('/', requireAuth, async (req, res) => {
  const page   = Math.max(parseInt(req.query.page) || 1, 1);
  const limit  = 20;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await db.query(`
      SELECT n.*, u.username AS from_username, u.avatar_url AS from_avatar
      FROM notifications n
      LEFT JOIN users u ON u.id = n.from_user_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const unread = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({ notifications: rows, unread: parseInt(unread.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// PUT /api/notifications/read-all — tümünü okundu yap
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Tümü okundu.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Okundu.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// Bildirim oluşturma yardımcısı (route'lardan çağrılır)
async function createNotification({ userId, fromUserId, type, message, link }) {
  if (userId === fromUserId) return; // Kendi kendine bildirim gönderme
  try {
    await db.query(
      `INSERT INTO notifications (user_id, from_user_id, type, message, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, fromUserId, type, message, link || null]
    );
  } catch (err) {
    console.error('notification error:', err.message);
  }
}

module.exports = { router, createNotification };
