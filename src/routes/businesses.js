const express = require('express');
const router  = express.Router();
const db      = require('../../config/db');
const { body, validationResult } = require('express-validator');
const { requireAuth, requireMod, optionalAuth } = require('../middleware/auth');
const slugify = require('slugify');

// GET /api/businesses?city=istanbul&cat=motor&page=1
router.get('/', optionalAuth, async (req, res) => {
  const { city, cat, page = 1 } = req.query;
  const limit  = 30;
  const offset = (parseInt(page) - 1) * limit;
  const params = ['approved'];
  let where    = 'WHERE b.status = $1';

  if (city) { params.push(city); where += ` AND LOWER(b.city) = LOWER($${params.length})`; }
  if (cat)  { params.push(cat);  where += ` AND b.category = $${params.length}`; }

  params.push(limit, offset);

  try {
    const { rows } = await db.query(`
      SELECT b.*, u.username AS owner
      FROM businesses b
      LEFT JOIN users u ON u.id = b.user_id
      ${where}
      ORDER BY b.avg_rating DESC, b.review_count DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const total = await db.query(
      `SELECT COUNT(*) FROM businesses b ${where}`,
      params.slice(0, params.length - 2)
    );

    res.json({ businesses: rows, total: parseInt(total.rows[0].count), page: parseInt(page), limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// GET /api/businesses/:slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, u.username AS owner FROM businesses b
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.slug = $1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Isletme bulunamadi.' });

    const reviewPage   = Math.max(parseInt(req.query.review_page) || 1, 1);
    const reviewLimit  = 20;
    const reviewOffset = (reviewPage - 1) * reviewLimit;
    const reviews = await db.query(
      `SELECT r.*, u.username FROM business_reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.business_id = $1 ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [rows[0].id, reviewLimit, reviewOffset]
    );

    res.json({ business: rows[0], reviews: reviews.rows });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// POST /api/businesses — yeni isletme ekle (onay bekler)
router.post('/', optionalAuth, [
  body('name').trim().isLength({ min: 3, max: 120 }).withMessage('Isletme adi 3-120 karakter olmali.'),
  body('category').trim().notEmpty().withMessage('Kategori secin.'),
  body('address').trim().notEmpty().withMessage('Adres zorunlu.'),
  body('city').trim().notEmpty().withMessage('Sehir zorunlu.'),
  body('phone').optional().trim(),
  body('lat').optional().isFloat({ min: 35, max: 43 }),
  body('lng').optional().isFloat({ min: 25, max: 45 }),
  body('price_range').optional().isInt({ min: 1, max: 4 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, category, description, address, city, district, phone, lat, lng, price_range, open_time, close_time, open_days } = req.body;

  let slug = slugify(name + '-' + city, { lower: true, strict: true });
  const ex = await db.query('SELECT id FROM businesses WHERE slug LIKE $1', [`${slug}%`]);
  if (ex.rows.length) slug = slug + '-' + Date.now();

  try {
    const { rows } = await db.query(`
      INSERT INTO businesses
        (user_id, name, slug, category, description, address, city, district, phone, lat, lng, price_range, open_time, close_time, open_days)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING id, slug, status`,
      [req.user?.id || null, name, slug, category, description || null, address, city, district || null,
       phone || null, lat || null, lng || null, price_range || 2,
       open_time || null, close_time || null, open_days || null]
    );
    res.status(201).json({ message: 'Isletme eklendi, onay bekleniyor.', slug: rows[0].slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// PUT /api/businesses/:id/approve — mod/admin onaylar
router.put('/:id/approve', requireAuth, requireMod, async (req, res) => {
  try {
    await db.query(`UPDATE businesses SET status = 'approved', updated_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Onaylandi.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// PUT /api/businesses/:id/reject
router.put('/:id/reject', requireAuth, requireMod, async (req, res) => {
  try {
    await db.query(`UPDATE businesses SET status = 'rejected', updated_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Reddedildi.' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// GET /api/businesses/admin/pending — bekleyen isletmeler (pagination)
router.get('/admin/pending', requireAuth, requireMod, async (req, res) => {
  const page   = Math.max(parseInt(req.query.page) || 1, 1);
  const limit  = 20;
  const offset = (page - 1) * limit;
  try {
    const { rows } = await db.query(
      `SELECT b.*, u.username AS owner FROM businesses b
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.status = 'pending' ORDER BY b.created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const total = await db.query("SELECT COUNT(*) FROM businesses WHERE status = 'pending'");
    res.json({ businesses: rows, total: parseInt(total.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// POST /api/businesses/:id/reviews — yorum ekle
router.post('/:id/reviews', requireAuth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Puan 1-5 arasinda olmali.'),
  body('body').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { rows } = await db.query(`
      INSERT INTO business_reviews (business_id, user_id, rating, body)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (business_id, user_id)
      DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body
      RETURNING *`,
      [req.params.id, req.user.id, req.body.rating, req.body.body || null]
    );
    // avg_rating ve review_count güncelle
    await db.query(`
      UPDATE businesses SET
        avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM business_reviews WHERE business_id = $1),
        review_count = (SELECT COUNT(*) FROM business_reviews WHERE business_id = $1),
        updated_at = NOW()
      WHERE id = $1
    `, [req.params.id]);

    res.status(201).json({ review: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

// GET /api/businesses/cities/list — sehir listesi
router.get('/cities/list', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT city, COUNT(*) as count FROM businesses WHERE status = 'approved' GROUP BY city ORDER BY count DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
});

module.exports = router;
