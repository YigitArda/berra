const express = require('express');
const { body, param, validationResult } = require('express-validator');
const slugify = require('slugify');
const db = require('../../config/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

function toSlug(value) {
  return slugify(String(value || ''), { lower: true, strict: true, locale: 'tr' }).trim();
}

function validationError(res, req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return true;
  }
  return false;
}

router.post('/users/:userId/follow', requireAuth, [param('userId').isInt({ min: 1 })], async (req, res) => {
  if (validationError(res, req)) return;

  const targetUserId = parseInt(req.params.userId, 10);
  if (targetUserId === req.user.id) {
    return res.status(400).json({ error: 'Kendini takip edemezsin.' });
  }

  try {
    const userRes = await db.query('SELECT id, username FROM users WHERE id = $1', [targetUserId]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    await db.query(
      `INSERT INTO user_follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, targetUserId]
    );

    await createNotification({
      userId: targetUserId,
      fromUserId: req.user.id,
      type: 'follow_user',
      message: `${req.user.username} seni takip etmeye başladı.`,
      link: `/profile/${req.user.username}`,
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

router.delete('/users/:userId/follow', requireAuth, [param('userId').isInt({ min: 1 })], async (req, res) => {
  if (validationError(res, req)) return;

  try {
    await db.query('DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2', [
      req.user.id,
      parseInt(req.params.userId, 10),
    ]);

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

router.post('/threads/:threadId/follow', requireAuth, [param('threadId').isInt({ min: 1 })], async (req, res) => {
  if (validationError(res, req)) return;

  const threadId = parseInt(req.params.threadId, 10);

  try {
    const thread = await db.query('SELECT id, user_id, slug, title FROM threads WHERE id = $1', [threadId]);
    if (!thread.rows.length) return res.status(404).json({ error: 'Konu bulunamadı.' });

    await db.query(
      `INSERT INTO thread_follows (user_id, thread_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, threadId]
    );

    await createNotification({
      userId: thread.rows[0].user_id,
      fromUserId: req.user.id,
      type: 'follow_thread',
      message: `${req.user.username} "${thread.rows[0].title}" konunu takip ediyor.`,
      link: `/thread/${thread.rows[0].slug}`,
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

router.delete('/threads/:threadId/follow', requireAuth, [param('threadId').isInt({ min: 1 })], async (req, res) => {
  if (validationError(res, req)) return;

  try {
    await db.query('DELETE FROM thread_follows WHERE user_id = $1 AND thread_id = $2', [
      req.user.id,
      parseInt(req.params.threadId, 10),
    ]);

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

router.post(
  '/models',
  requireAuth,
  [body('brand').trim().isLength({ min: 2, max: 100 }), body('model').trim().isLength({ min: 1, max: 100 }), body('generation').optional().trim().isLength({ max: 120 }), body('description').optional().isString()],
  async (req, res) => {
    if (validationError(res, req)) return;

    const brand = req.body.brand.trim();
    const model = req.body.model.trim();
    const generation = typeof req.body.generation === 'string' ? req.body.generation.trim() : null;
    const slugBase = `${brand}-${model}${generation ? `-${generation}` : ''}`;
    const slug = toSlug(slugBase);

    try {
      const existing = await db.query('SELECT id, slug FROM car_models WHERE slug = $1', [slug]);
      if (existing.rows.length) {
        return res.json({ model: existing.rows[0], existing: true });
      }

      const created = await db.query(
        `INSERT INTO car_models (brand, model, slug, generation, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, brand, model, slug, generation, description`,
        [brand, model, slug, generation, req.body.description || null],
      );

      return res.status(201).json({ model: created.rows[0] });
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası.' });
    }
  },
);

router.get('/models', optionalAuth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const offset = (page - 1) * limit;

  try {
    const { rows } = await db.query(
      `SELECT id, brand, model, generation, slug, description, created_at
       FROM car_models
       ORDER BY brand ASC, model ASC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return res.json({ models: rows, page, limit });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

router.get('/models/:slug', optionalAuth, async (req, res) => {
  try {
    const modelRes = await db.query(
      `SELECT id, brand, model, generation, slug, description, created_at
       FROM car_models
       WHERE slug = $1`,
      [req.params.slug],
    );
    if (!modelRes.rows.length) return res.status(404).json({ error: 'Model bulunamadı.' });

    const carModel = modelRes.rows[0];

    const [threads, users, maintenance, galleries, score, issues] = await Promise.all([
      db.query(
        `SELECT t.id, t.title, t.slug, t.reply_count, t.view_count, t.created_at
         FROM thread_models tm
         JOIN threads t ON t.id = tm.thread_id
         WHERE tm.car_model_id = $1
         ORDER BY t.last_reply_at DESC NULLS LAST, t.created_at DESC
         LIMIT 30`,
        [carModel.id],
      ),
      db.query(
        `SELECT uc.id, uc.year, uc.notes, uc.is_current, u.username
         FROM user_cars uc
         JOIN users u ON u.id = uc.user_id
         WHERE LOWER(uc.brand) = LOWER($1) AND LOWER(uc.model) = LOWER($2)
         ORDER BY uc.is_current DESC, uc.year DESC
         LIMIT 30`,
        [carModel.brand, carModel.model],
      ),
      db.query(
        `SELECT ml.id, ml.type, ml.done_date, ml.done_km, ml.note, u.username
         FROM maintenance_logs ml
         JOIN user_cars uc ON uc.id = ml.car_id
         JOIN users u ON u.id = ml.user_id
         WHERE LOWER(uc.brand) = LOWER($1) AND LOWER(uc.model) = LOWER($2)
         ORDER BY ml.done_date DESC
         LIMIT 40`,
        [carModel.brand, carModel.model],
      ),
      db.query(
        `SELECT gp.id, gp.image_url, gp.caption, gp.like_count, gp.created_at, u.username
         FROM gallery_photos gp
         LEFT JOIN user_cars uc ON uc.id = gp.car_id
         JOIN users u ON u.id = gp.user_id
         WHERE LOWER(COALESCE(uc.brand, '')) = LOWER($1)
           AND LOWER(COALESCE(uc.model, '')) = LOWER($2)
         ORDER BY gp.created_at DESC
         LIMIT 40`,
        [carModel.brand, carModel.model],
      ),
      db.query(
        `SELECT ROUND(AVG(score)::numeric, 2) AS avg_score, COUNT(*)::int AS total_votes
         FROM car_scores
         WHERE LOWER(brand) = LOWER($1) AND LOWER(model) = LOWER($2)`,
        [carModel.brand, carModel.model],
      ),
      db.query(
        `SELECT id, title, body, severity, created_at
         FROM model_chronic_issues
         WHERE car_model_id = $1
         ORDER BY severity DESC, created_at DESC
         LIMIT 20`,
        [carModel.id],
      ),
    ]);

    return res.json({
      model: carModel,
      threads: threads.rows,
      user_cars: users.rows,
      maintenance_logs: maintenance.rows,
      galleries: galleries.rows,
      score: score.rows[0],
      chronic_issues: issues.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

router.post('/models/:modelId/follow', requireAuth, [param('modelId').isInt({ min: 1 })], async (req, res) => {
  if (validationError(res, req)) return;
  const modelId = parseInt(req.params.modelId, 10);

  try {
    const model = await db.query('SELECT id, brand, model, slug FROM car_models WHERE id = $1', [modelId]);
    if (!model.rows.length) return res.status(404).json({ error: 'Model bulunamadı.' });

    await db.query(
      `INSERT INTO car_model_follows (user_id, car_model_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, modelId],
    );

    return res.status(201).json({ ok: true, link: `/models/${model.rows[0].slug}` });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

router.delete('/models/:modelId/follow', requireAuth, [param('modelId').isInt({ min: 1 })], async (req, res) => {
  if (validationError(res, req)) return;

  try {
    await db.query('DELETE FROM car_model_follows WHERE user_id = $1 AND car_model_id = $2', [
      req.user.id,
      parseInt(req.params.modelId, 10),
    ]);

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
