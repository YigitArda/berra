const express = require('express');
const router  = express.Router();
const db      = require('../../config/db');

// GET /api/search?q=corolla&type=threads
router.get('/', async (req, res) => {
  const q    = (req.query.q || '').trim();
  const type = req.query.type || 'threads';

  if (q.length < 2 || q.length > 200) return res.json({ results: [] });

  try {
    if (type === 'threads') {
      const { rows } = await db.query(`
        SELECT
          t.id, t.title, t.slug, t.reply_count, t.view_count, t.created_at,
          u.username AS author,
          c.name AS category_name
        FROM threads t
        JOIN users u ON u.id = t.user_id
        JOIN categories c ON c.id = t.category_id
        WHERE
          t.title ILIKE $1 OR
          EXISTS (
            SELECT 1 FROM posts p
            WHERE p.thread_id = t.id AND p.body ILIKE $1 AND p.is_deleted = false
          )
        ORDER BY t.last_reply_at DESC NULLS LAST
        LIMIT 20
      `, [`%${q}%`]);
      return res.json({ results: rows, query: q });
    }

    res.json({ results: [], query: q });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
