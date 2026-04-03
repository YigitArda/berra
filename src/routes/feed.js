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
        f.id, f.body, f.like_count, f.comment_count, f.created_at,
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
    const result = await db.query(
      'INSERT INTO feed_likes (user_id, feed_post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [req.user.id, feedId]
    );
    if (result.rows.length > 0) {
      await db.query('UPDATE feed_posts SET like_count = like_count + 1 WHERE id = $1', [feedId]);
    }
    const { rows } = await db.query('SELECT like_count FROM feed_posts WHERE id = $1', [feedId]);
    res.json({ like_count: rows[0]?.like_count ?? 0 });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// GET /api/feed/:id/comments
router.get('/:id/comments', optionalAuth, async (req, res) => {
  const feedId = parseInt(req.params.id);
  if (!feedId) return res.status(400).json({ error: 'Geçersiz ID.' });
  try {
    const { rows } = await db.query(`
      SELECT fc.id, fc.body, fc.created_at, u.username, u.avatar_url
      FROM feed_comments fc
      JOIN users u ON u.id = fc.user_id
      WHERE fc.feed_post_id = $1
      ORDER BY fc.created_at ASC
    `, [feedId]);
    res.json({ comments: rows });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/feed/:id/comment
router.post('/:id/comment', requireAuth, [
  body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Yorum 1-500 karakter olmalı.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const feedId = parseInt(req.params.id);
  if (!feedId) return res.status(400).json({ error: 'Geçersiz ID.' });

  try {
    // Gönderi var mı?
    const { rows: postRows } = await db.query('SELECT id FROM feed_posts WHERE id = $1', [feedId]);
    if (!postRows.length) return res.status(404).json({ error: 'Gönderi bulunamadı.' });

    const { rows } = await db.query(`
      INSERT INTO feed_comments (feed_post_id, user_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, body, created_at
    `, [feedId, req.user.id, req.body.text]);

    await db.query('UPDATE feed_posts SET comment_count = comment_count + 1 WHERE id = $1', [feedId]);

    res.status(201).json({ comment: { ...rows[0], username: req.user.username } });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// DELETE /api/feed/:id/like
router.delete('/:id/like', requireAuth, async (req, res) => {
  const feedId = parseInt(req.params.id);
  try {
    const result = await db.query(
      'DELETE FROM feed_likes WHERE user_id = $1 AND feed_post_id = $2 RETURNING *',
      [req.user.id, feedId]
    );
    if (result.rows.length > 0) {
      await db.query('UPDATE feed_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1', [feedId]);
    }
    const { rows } = await db.query('SELECT like_count FROM feed_posts WHERE id = $1', [feedId]);
    res.json({ like_count: rows[0]?.like_count ?? 0 });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
