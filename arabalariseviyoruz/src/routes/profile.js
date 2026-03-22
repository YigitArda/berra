const express  = require('express');
const router   = express.Router();
const db       = require('../../config/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// PUT /api/profile/me/info — bio güncelle
router.put('/me/info', requireAuth, [
  body('bio').optional().isLength({ max: 300 }).withMessage('Bio en fazla 300 karakter.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const { bio } = req.body;
    await db.query('UPDATE users SET bio = $1, updated_at = NOW() WHERE id = $2', [bio, req.user.id]);
    res.json({ message: 'Profil güncellendi.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// PUT /api/profile/me/avatar — base64 avatar kaydet
router.put('/me/avatar', requireAuth, async (req, res) => {
  const { avatar_url } = req.body;
  if (!avatar_url) return res.status(422).json({ error: 'Avatar verisi eksik.' });
  // Sadece base64 data URL kabul et
  if (!avatar_url.startsWith('data:image/')) return res.status(422).json({ error: 'Geçersiz format.' });
  // Max ~300KB (base64 ~400KB)
  if (avatar_url.length > 400000) return res.status(422).json({ error: 'Resim çok büyük. Max 300KB.' });
  try {
    await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatar_url, req.user.id]);
    res.json({ message: 'Avatar güncellendi.', avatar_url });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/profile/me/cars — araç ekle
router.post('/me/cars', requireAuth, [
  body('brand').trim().notEmpty().withMessage('Marka zorunlu.'),
  body('model').trim().notEmpty().withMessage('Model zorunlu.'),
  body('year').isInt({ min: 1950, max: 2030 }).withMessage('Geçerli yıl girin.'),
  body('owned_from').optional().isInt({ min: 1950, max: 2030 }),
  body('owned_to').optional().isInt({ min: 1950, max: 2030 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  const { brand, model, year, notes, owned_from, owned_to, is_current } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO user_cars (user_id, brand, model, year, notes, owned_from, owned_to, is_current)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, brand, model, year, notes || null, owned_from || null, owned_to || null, !!is_current]
    );
    res.status(201).json({ car: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// DELETE /api/profile/me/cars/:id — araç sil
router.delete('/me/cars/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM user_cars WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Araç silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// GET /api/profile/:username — herkese açık profil
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    // Kullanıcı bilgileri
    const userRes = await db.query(
      `SELECT id, username, bio, avatar_url, role, created_at
       FROM users WHERE username = $1`,
      [req.params.username]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    const u = userRes.rows[0];

    // Açtığı konular
    const threadsRes = await db.query(
      `SELECT t.id, t.title, t.slug, t.reply_count, t.view_count, t.created_at,
              c.name AS category_name
       FROM threads t
       JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC LIMIT 20`,
      [u.id]
    );

    // Yazdığı yanıtlar
    const postsRes = await db.query(
      `SELECT p.id, p.body, p.like_count, p.created_at,
              t.title AS thread_title, t.slug AS thread_slug
       FROM posts p
       JOIN threads t ON t.id = p.thread_id
       WHERE p.user_id = $1 AND p.is_deleted = false
       ORDER BY p.created_at DESC LIMIT 20`,
      [u.id]
    );

    // Araçları
    const carsRes = await db.query(
      `SELECT * FROM user_cars WHERE user_id = $1 ORDER BY is_current DESC, owned_from DESC NULLS LAST`,
      [u.id]
    );

    res.json({
      user:    u,
      threads: threadsRes.rows,
      posts:   postsRes.rows,
      cars:    carsRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});


module.exports = router;
