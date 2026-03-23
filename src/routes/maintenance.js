const express = require('express');
const router  = express.Router();
const db      = require('../../config/db');
const { body, validationResult } = require('express-validator');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validateImageMime } = require('../middleware/sanitize');

// ── BAKIM TAKVİMİ ─────────────────────────────────────────────

// GET /api/maintenance — kullanicinin tum bakim kayitlari
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT m.*, uc.brand, uc.model, uc.year
      FROM maintenance_logs m
      LEFT JOIN user_cars uc ON uc.id = m.car_id
      WHERE m.user_id = $1
      ORDER BY m.done_date DESC
    `, [req.user.id]);
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// GET /api/maintenance/upcoming — yaklasan bakimlar
router.get('/upcoming', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT m.*, uc.brand, uc.model, uc.year
      FROM maintenance_logs m
      LEFT JOIN user_cars uc ON uc.id = m.car_id
      WHERE m.user_id = $1
        AND (m.next_date >= NOW() OR m.next_km IS NOT NULL)
      ORDER BY m.next_date ASC NULLS LAST
      LIMIT 10
    `, [req.user.id]);
    res.json({ upcoming: rows });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// POST /api/maintenance
router.post('/', requireAuth, [
  body('type').trim().notEmpty().withMessage('Bakim turu zorunlu.'),
  body('done_date').isDate().withMessage('Gecerli tarih girin.'),
  body('done_km').optional().isInt({ min: 0 }),
  body('next_date').optional().isDate(),
  body('next_km').optional().isInt({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { type, done_date, done_km, next_date, next_km, note, car_id } = req.body;
  try {
    const { rows } = await db.query(`
      INSERT INTO maintenance_logs (user_id, car_id, type, done_date, done_km, next_date, next_km, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, car_id || null, type, done_date, done_km || null,
       next_date || null, next_km || null, note || null]
    );
    await checkAndAwardBadges(req.user.id);
    res.status(201).json({ log: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM maintenance_logs WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// ── ROZETLER ─────────────────────────────────────────────────

// GET /api/maintenance/badges/:username
router.get('/badges/:username', optionalAuth, async (req, res) => {
  try {
    const user = await db.query('SELECT id FROM users WHERE username=$1', [req.params.username]);
    if (!user.rows.length) return res.status(404).json({ error: 'Kullanici bulunamadi.' });
    const uid = user.rows[0].id;

    const { rows } = await db.query(`
      SELECT bd.slug, bd.name, bd.icon, bd.description, ub.earned_at
      FROM user_badges ub
      JOIN badge_definitions bd ON bd.id = ub.badge_id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at ASC
    `, [uid]);
    res.json({ badges: rows });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// POST /api/maintenance/badges/check — rozet kontrol & ver
router.post('/badges/check', requireAuth, async (req, res) => {
  try {
    const awarded = await checkAndAwardBadges(req.user.id);
    res.json({ awarded });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

async function checkAndAwardBadges(userId) {
  const stats = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM posts WHERE user_id=$1 AND is_deleted=false) AS posts,
      (SELECT COUNT(*) FROM threads WHERE user_id=$1) AS threads,
      (SELECT COUNT(*) FROM user_cars WHERE user_id=$1) AS cars,
      (SELECT COALESCE(SUM(like_count),0) FROM posts WHERE user_id=$1) AS likes,
      (SELECT COUNT(*) FROM gallery_photos WHERE user_id=$1) AS photos
  `, [userId]);

  const s = stats.rows[0];
  const conditions = {
    'ilk-yorum':    parseInt(s.posts)   >= 1,
    'aktif-uye':    parseInt(s.posts)   >= 10,
    'forum-ustasi': parseInt(s.posts)   >= 50,
    'usta':         parseInt(s.posts)   >= 100,
    'ilk-konu':     parseInt(s.threads) >= 1,
    'rehber':       parseInt(s.threads) >= 10,
    'arac-sahibi':  parseInt(s.cars)    >= 1,
    'koleksiyoner': parseInt(s.cars)    >= 3,
    'fotograf':     parseInt(s.photos)  >= 1,
    'populer':      parseInt(s.likes)   >= 50,
  };

  const defs = await db.query('SELECT id, slug FROM badge_definitions');
  const existing = await db.query('SELECT badge_id FROM user_badges WHERE user_id=$1', [userId]);
  const existingIds = new Set(existing.rows.map(r => r.badge_id));

  const awarded = [];
  for (const def of defs.rows) {
    if (conditions[def.slug] && !existingIds.has(def.id)) {
      await db.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, def.id]);
      awarded.push(def.slug);
    }
  }
  return awarded;
}

// ── GALERİ ───────────────────────────────────────────────────

// GET /api/maintenance/gallery?page=1&user=username
router.get('/gallery', optionalAuth, async (req, res) => {
  const page   = Math.max(parseInt(req.query.page) || 1, 1);
  const limit  = 24;
  const offset = (page - 1) * limit;
  const username = req.query.user;

  let where = '';
  const params = [limit, offset];

  if (username) {
    const u = await db.query('SELECT id FROM users WHERE username=$1', [username]);
    if (u.rows.length) { params.push(u.rows[0].id); where = `WHERE g.user_id = $${params.length}`; }
  }

  try {
    const { rows } = await db.query(`
      SELECT g.*, u.username,
             uc.brand AS car_brand, uc.model AS car_model, uc.year AS car_year
      FROM gallery_photos g
      JOIN users u ON u.id = g.user_id
      LEFT JOIN user_cars uc ON uc.id = g.car_id
      ${where}
      ORDER BY g.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);
    res.json({ photos: rows, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// POST /api/maintenance/gallery — fotograf yukle
router.post('/gallery', requireAuth, [
  body('image_url').notEmpty().withMessage('Fotograf zorunlu.'),
  body('caption').optional().isLength({ max: 200 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { image_url, caption, car_id } = req.body;
  if (!image_url.startsWith('data:image/') && !image_url.startsWith('http'))
    return res.status(422).json({ error: 'Gecersiz resim formati.' });
  // MIME type kontrolü — sadece jpeg, png, gif, webp
  if (!validateImageMime(image_url))
    return res.status(422).json({ error: 'Sadece JPEG, PNG, GIF veya WEBP formatı kabul edilir.' });
  if (image_url.startsWith('data:') && image_url.length > 2000000)
    return res.status(422).json({ error: 'Resim cok buyuk. Max 1.5MB.' });

  try {
    const { rows } = await db.query(`
      INSERT INTO gallery_photos (user_id, car_id, image_url, caption)
      VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, car_id || null, image_url, caption || null]
    );
    await checkAndAwardBadges(req.user.id);
    res.status(201).json({ photo: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// POST /api/maintenance/gallery/:id/like
router.post('/gallery/:id/like', requireAuth, async (req, res) => {
  const photoId = parseInt(req.params.id, 10);
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');

    const insertResult = await client.query(
      'INSERT INTO gallery_likes (user_id, photo_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING 1',
      [req.user.id, photoId]
    );

    if (insertResult.rowCount > 0) {
      await client.query(
        'UPDATE gallery_photos SET like_count = like_count + 1 WHERE id = $1',
        [photoId]
      );
    }

    const { rows } = await client.query(
      'SELECT like_count FROM gallery_photos WHERE id = $1',
      [photoId]
    );

    await client.query('COMMIT');
    res.json({ like_count: rows[0]?.like_count ?? 0 });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ error: 'Sunucu hatasi.' });
  } finally {
    client?.release();
  }
});

// DELETE /api/maintenance/gallery/:id/like
router.delete('/gallery/:id/like', requireAuth, async (req, res) => {
  const photoId = parseInt(req.params.id, 10);
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');

    const deleteResult = await client.query(
      'DELETE FROM gallery_likes WHERE user_id=$1 AND photo_id=$2 RETURNING 1',
      [req.user.id, photoId]
    );

    if (deleteResult.rowCount > 0) {
      await client.query(
        'UPDATE gallery_photos SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
        [photoId]
      );
    }

    const { rows } = await client.query(
      'SELECT like_count FROM gallery_photos WHERE id = $1',
      [photoId]
    );

    await client.query('COMMIT');
    res.json({ like_count: rows[0]?.like_count ?? 0 });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ error: 'Sunucu hatasi.' });
  } finally {
    client?.release();
  }
});

// DELETE /api/maintenance/gallery/:id
router.delete('/gallery/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM gallery_photos WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Silindi.' });
  } catch (err) { res.status(500).json({ error: 'Sunucu hatasi.' }); }
});

module.exports = { router, checkAndAwardBadges };
