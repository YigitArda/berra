const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const db = require('../../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const VALID_TYPES = ['post', 'feed_post', 'feed_comment'];
const VALID_REASONS = [
  'spam', 'hakaret', 'nefret_söylemi', 'yanlış_bilgi',
  'uygunsuz_içerik', 'telif_hakkı', 'diğer'
];

// POST /api/reports — yeni şikayet gönder
router.post('/', requireAuth, [
  body('target_type').isIn(VALID_TYPES).withMessage('Geçersiz içerik türü.'),
  body('target_id').isInt({ min: 1 }).withMessage('Geçersiz içerik ID.'),
  body('reason').isIn(VALID_REASONS).withMessage('Geçersiz şikayet nedeni.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { target_type, target_id, reason } = req.body;

  try {
    await db.query(`
      INSERT INTO reports (reporter_id, target_type, target_id, reason)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (reporter_id, target_type, target_id) DO NOTHING
    `, [req.user.id, target_type, parseInt(target_id), reason]);

    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// GET /api/reports/admin — bekleyen şikayetleri listele (admin)
router.get('/admin', requireAdmin, async (req, res) => {
  const page   = Math.max(parseInt(req.query.page) || 1, 1);
  const limit  = 30;
  const offset = (page - 1) * limit;
  const status = req.query.status || 'pending';

  try {
    const { rows } = await db.query(`
      SELECT r.id, r.target_type, r.target_id, r.reason, r.status, r.created_at,
             u.username AS reporter
      FROM reports r
      JOIN users u ON u.id = r.reporter_id
      WHERE r.status = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    const { rows: countRows } = await db.query(
      'SELECT COUNT(*) FROM reports WHERE status = $1', [status]
    );

    res.json({ reports: rows, total: parseInt(countRows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// PUT /api/reports/admin/:id — şikayeti çöz veya reddet (admin)
router.put('/admin/:id', requireAdmin, [
  body('status').isIn(['resolved', 'dismissed']).withMessage('Geçersiz durum.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { rows } = await db.query(
      'UPDATE reports SET status = $1 WHERE id = $2 RETURNING *',
      [req.body.status, parseInt(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Şikayet bulunamadı.' });
    res.json({ report: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
