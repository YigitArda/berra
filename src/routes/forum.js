const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const slugify = require('slugify');
const db      = require('../../config/db');
const { requireAuth, optionalAuth, requireMod } = require('../middleware/auth');
const { createNotification } = require('./notifications');

// Forum yazma işlemleri için rate limit — 5 dk'da max 10 istek
const forumWriteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla içerik gönderdiniz. 5 dakika bekleyin.' },
});

// --- KATEGORILER ---

// GET /api/forum/categories
router.get('/categories', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// --- KONULAR (THREADS) ---

// GET /api/forum/threads?category=slug&page=1
router.get('/threads', optionalAuth, async (req, res) => {
  const page     = Math.max(parseInt(req.query.page) || 1, 1);
  const limit    = 20;
  const offset   = (page - 1) * limit;
  const catSlug  = req.query.category;

  try {
    let whereClause = '';
    let params      = [limit, offset];

    if (catSlug) {
      const cat = await db.query('SELECT id FROM categories WHERE slug = $1', [catSlug]);
      if (cat.rows.length === 0) return res.status(404).json({ error: 'Kategori bulunamadı.' });
      whereClause = 'WHERE t.category_id = $3';
      params.push(cat.rows[0].id);
    }

    const { rows } = await db.query(`
      SELECT
        t.id, t.title, t.slug, t.is_pinned, t.is_locked,
        t.view_count, t.reply_count, t.last_reply_at, t.created_at,
        u.username AS author,
        u.avatar_url AS author_avatar,
        c.name AS category_name,
        c.slug AS category_slug
      FROM threads t
      JOIN users      u ON u.id = t.user_id
      JOIN categories c ON c.id = t.category_id
      ${whereClause}
      ORDER BY t.is_pinned DESC, t.last_reply_at DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `, params);

    res.json({ threads: rows, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// GET /api/forum/threads/:slug
router.get('/threads/:slug', optionalAuth, async (req, res) => {
  const page  = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = 25;
  const offset = (page - 1) * limit;

  try {
    // Konuyu getir + görüntülenme sayısını artır
    const threadRes = await db.query(`
      UPDATE threads SET view_count = view_count + 1
      WHERE slug = $1
      RETURNING id, title, slug, is_pinned, is_locked, view_count, reply_count, created_at,
                user_id, category_id
    `, [req.params.slug]);

    if (threadRes.rows.length === 0) return res.status(404).json({ error: 'Konu bulunamadı.' });
    const thread = threadRes.rows[0];

    // Yorumları getir
    const postsRes = await db.query(`
      SELECT
        p.id, p.body, p.like_count, p.is_deleted, p.created_at, p.updated_at,
        u.username, u.avatar_url, u.role
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.thread_id = $1
      ORDER BY p.created_at ASC
      LIMIT $2 OFFSET $3
    `, [thread.id, limit, offset]);

    res.json({ thread, posts: postsRes.rows, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/forum/threads — yeni konu aç
router.post('/threads', requireAuth, forumWriteLimiter, [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Başlık 5-200 karakter olmalı.'),
  body('body').trim().isLength({ min: 10 }).withMessage('İçerik en az 10 karakter olmalı.'),
  body('category_id').isInt({ min: 1 }).withMessage('Geçerli bir kategori seçin.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { title, body: postBody, category_id } = req.body;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Benzersiz slug oluştur
    let slug = slugify(title, { lower: true, strict: true, locale: 'tr' });
    const existing = await client.query('SELECT id FROM threads WHERE slug LIKE $1', [`${slug}%`]);
    if (existing.rows.length > 0) slug = `${slug}-${Date.now()}`;

    const threadRes = await client.query(`
      INSERT INTO threads (user_id, category_id, title, slug)
      VALUES ($1, $2, $3, $4)
      RETURNING id, slug
    `, [req.user.id, category_id, title, slug]);

    const thread = threadRes.rows[0];

    await client.query(`
      INSERT INTO posts (thread_id, user_id, body)
      VALUES ($1, $2, $3)
    `, [thread.id, req.user.id, postBody]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Konu açıldı.', slug: thread.slug });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  } finally {
    client.release();
  }
});

// POST /api/forum/threads/:slug/posts — yanıt yaz
router.post('/threads/:slug/posts', requireAuth, forumWriteLimiter, [
  body('body').trim().isLength({ min: 1 }).withMessage('Yanıt boş olamaz.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const threadRes = await db.query('SELECT id, is_locked FROM threads WHERE slug = $1', [req.params.slug]);
    if (threadRes.rows.length === 0) return res.status(404).json({ error: 'Konu bulunamadı.' });

    const thread = threadRes.rows[0];
    if (thread.is_locked) return res.status(403).json({ error: 'Bu konu kilitli.' });

    const { rows } = await db.query(`
      INSERT INTO posts (thread_id, user_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, body, created_at
    `, [thread.id, req.user.id, req.body.body]);

    // Konu sahibine bildirim gönder
    const threadOwner = await db.query('SELECT user_id FROM threads WHERE id = $1', [thread.id]);
    if (threadOwner.rows.length && threadOwner.rows[0].user_id !== req.user.id) {
      await createNotification({
        userId: threadOwner.rows[0].user_id,
        fromUserId: req.user.id,
        type: 'reply',
        message: req.user.username + ' konuna yanıt yazdı.',
        link: '/thread/' + req.params.slug,
      });
    }

    // reply_count ve last_reply_at güncelle
    await db.query(
      'UPDATE threads SET reply_count = reply_count + 1, last_reply_at = NOW() WHERE id = $1',
      [thread.id]
    );

    res.status(201).json({ message: 'Yanıt eklendi.', post: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/forum/posts/:id/like — beğeni
router.post('/posts/:id/like', requireAuth, async (req, res) => {
  const postId = parseInt(req.params.id);
  try {
    const result = await db.query(
      'INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [req.user.id, postId]
    );
    if (result.rows.length > 0) {
      await db.query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1', [postId]);
      // Beğeni bildirimi
      const postOwner = await db.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
      if (postOwner.rows.length && postOwner.rows[0].user_id !== req.user.id) {
        await createNotification({
          userId: postOwner.rows[0].user_id,
          fromUserId: req.user.id,
          type: 'like',
          message: req.user.username + ' yorumunu beğendi.',
        });
      }
    }
    const { rows } = await db.query('SELECT like_count FROM posts WHERE id = $1', [postId]);
    res.json({ like_count: rows[0]?.like_count ?? 0 });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// DELETE /api/forum/posts/:id/like — beğeniyi geri al
router.delete('/posts/:id/like', requireAuth, async (req, res) => {
  const postId = parseInt(req.params.id);
  try {
    const result = await db.query(
      'DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2 RETURNING *',
      [req.user.id, postId]
    );
    if (result.rows.length > 0) {
      await db.query('UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1', [postId]);
    }
    const { rows } = await db.query('SELECT like_count FROM posts WHERE id = $1', [postId]);
    res.json({ like_count: rows[0]?.like_count ?? 0 });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// DELETE /api/forum/posts/:id — kendi postunu sil (soft delete)
router.delete('/posts/:id', requireAuth, async (req, res) => {
  const postId = parseInt(req.params.id);
  const isMod  = ['mod', 'admin'].includes(req.user.role);
  try {
    const { rows } = await db.query(
      `UPDATE posts
       SET is_deleted = true, body = '[Bu yorum silindi]',
           deleted_at = NOW(), deleted_by = $3, updated_at = NOW()
       WHERE id = $1 AND (user_id = $2 OR $4 = true)
       RETURNING thread_id`,
      [postId, req.user.id, req.user.id, isMod]
    );
    if (!rows.length) return res.status(404).json({ error: 'Yorum bulunamadı veya yetkiniz yok.' });
    // reply_count'u düşür (ilk yorum (thread gövdesi) silinmez sayılır)
    await db.query(
      'UPDATE threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = $1',
      [rows[0].thread_id]
    );
    res.json({ message: 'Yorum silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// PUT /api/forum/threads/:slug/lock — konu kilitle/aç (mod)
router.put('/threads/:slug/lock', requireAuth, requireMod, async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE threads SET is_locked = NOT is_locked WHERE slug = $1 RETURNING is_locked',
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Konu bulunamadı.' });
    res.json({ message: rows[0].is_locked ? 'Konu kilitlendi.' : 'Konu açıldı.', is_locked: rows[0].is_locked });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// PUT /api/forum/threads/:slug/pin — konu sabitle/kaldır (mod)
router.put('/threads/:slug/pin', requireAuth, requireMod, async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE threads SET is_pinned = NOT is_pinned WHERE slug = $1 RETURNING is_pinned',
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Konu bulunamadı.' });
    res.json({ message: rows[0].is_pinned ? 'Konu sabitlendi.' : 'Sabitleme kaldırıldı.', is_pinned: rows[0].is_pinned });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
