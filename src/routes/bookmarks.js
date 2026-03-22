const express = require('express');
const router  = express.Router();
const db      = require('../../config/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/bookmarks — kaydedilenler
router.get('/', requireAuth, async (req, res) => {
  const page   = Math.max(parseInt(req.query.page) || 1, 1);
  const limit  = 20;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await db.query(`
      SELECT b.id AS bookmark_id, b.created_at AS saved_at,
             t.id, t.title, t.slug, t.reply_count, t.view_count, t.created_at,
             u.username AS author,
             c.name AS category_name
      FROM bookmarks b
      JOIN threads t ON t.id = b.thread_id
      JOIN users u ON u.id = t.user_id
      JOIN categories c ON c.id = t.category_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    res.json({ bookmarks: rows, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/bookmarks/:threadId — kaydet
router.post('/:threadId', requireAuth, async (req, res) => {
  try {
    await db.query(
      'INSERT INTO bookmarks (user_id, thread_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.threadId]
    );
    res.json({ message: 'Kaydedildi.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// DELETE /api/bookmarks/:threadId — kaydı kaldır
router.delete('/:threadId', requireAuth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND thread_id = $2',
      [req.user.id, req.params.threadId]
    );
    res.json({ message: 'Kayıt kaldırıldı.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// GET /api/bookmarks/check/:threadId — bu thread kayıtlı mı?
router.get('/check/:threadId', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND thread_id = $2',
      [req.user.id, req.params.threadId]
    );
    res.json({ bookmarked: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
