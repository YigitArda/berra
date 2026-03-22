const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const db      = require('../../config/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/feed?page=1
router.get('/', optionalAuth, async (req, res) => {
  const page   = Math.max(parseInt(req.query.page) || 1, 1);
  const limit  = 30;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await db.query(`
      SELECT
        f.id, f.body, f.like_count, f.created_at,
        u.username, u.avatar_url
      FROM feed_posts f
      JOIN users u ON u.id = f.user_id
      ORDER BY f.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({ posts: rows, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/feed
router.post('/', requireAuth, [
  body('body').trim().isLength({ min: 1, max: 500 }).withMessage('Post 1-500 karakter olmalı.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { rows } = await db.query(`
      INSERT INTO feed_posts (user_id, body)
      VALUES ($1, $2)
      RETURNING id, body, created_at
    `, [req.user.id, req.body.body]);

    res.status(201).json({ post: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/feed/:id/like
router.post('/:id/like', requireAuth, async (req, res) => {
  const feedId = parseInt(req.params.id);
  try {
    await db.query(
      'INSERT INTO feed_likes (user_id, feed_post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, feedId]
    );
    const { rows } = await db.query('SELECT like_count FROM feed_posts WHERE id = $1', [feedId]);
    res.json({ like_count: rows[0]?.like_count ?? 0 });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
