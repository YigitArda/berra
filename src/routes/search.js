const express = require('express');
const router  = express.Router();
const db      = require('../../config/db');

const SEARCH_CACHE_TTL_MS = 30 * 1000;
const SHORT_QUERY_WINDOW_MS = 60 * 1000;
const SHORT_QUERY_MAX_REQUESTS = 20;
const SEARCH_CACHE_MAX_SIZE = 500;
const searchCache = new Map();
const shortQueryHits = new Map();

// Süresi dolmuş cache girişlerini periyodik olarak temizle
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of searchCache) {
    if (entry.expiresAt < now) searchCache.delete(key);
  }
  // Hâlâ limitin üzerindeyse en eski girişleri sil
  if (searchCache.size > SEARCH_CACHE_MAX_SIZE) {
    const excess = searchCache.size - SEARCH_CACHE_MAX_SIZE;
    let removed = 0;
    for (const key of searchCache.keys()) {
      if (removed >= excess) break;
      searchCache.delete(key);
      removed++;
    }
  }
}, 60 * 1000).unref();

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
}

function getCache(key) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    searchCache.delete(key);
    return null;
  }
  return entry.payload;
}

function setCache(key, payload) {
  searchCache.set(key, {
    payload,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
}

function throttleShortQueries(req, q) {
  if (q.length >= 2) return null;

  const ip = getClientIp(req);
  const now = Date.now();
  const hit = shortQueryHits.get(ip);

  if (!hit || hit.resetAt < now) {
    shortQueryHits.set(ip, { count: 1, resetAt: now + SHORT_QUERY_WINDOW_MS });
    return null;
  }

  hit.count += 1;
  if (hit.count > SHORT_QUERY_MAX_REQUESTS) {
    return {
      status: 429,
      body: {
        error: 'Çok fazla kısa/boş arama isteği gönderdiniz. Lütfen biraz bekleyin.',
      },
    };
  }

  return null;
}

// GET /api/search?q=corolla&type=threads&page=1&limit=20
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  const type = req.query.type || 'threads';
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const offset = (page - 1) * limit;

  const throttleResult = throttleShortQueries(req, q);
  if (throttleResult) {
    return res.status(throttleResult.status).json(throttleResult.body);
  }

  const cacheKey = `${type}:${q}:${page}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  if (q.length < 2 || q.length > 200) {
    const payload = { results: [], query: q, page, limit, total: 0, next_page: null };
    setCache(cacheKey, payload);
    return res.json(payload);
  }

  try {
    if (type === 'threads') {
      const { rows } = await db.query(`
        WITH tsq AS (
          SELECT websearch_to_tsquery('simple', $1) AS query
        ), ranked AS (
          SELECT
            t.id,
            t.title,
            t.slug,
            t.reply_count,
            t.view_count,
            t.created_at,
            t.last_reply_at,
            u.username AS author,
            c.name AS category_name,
            (
              ts_rank_cd(
                setweight(to_tsvector('simple', COALESCE(t.title, '')), 'A'),
                tsq.query
              ) * 1.8
              + COALESCE(post_rank.body_rank, 0) * 0.7
            ) AS rank_score
          FROM threads t
          JOIN users u ON u.id = t.user_id
          JOIN categories c ON c.id = t.category_id
          CROSS JOIN tsq
          LEFT JOIN LATERAL (
            SELECT MAX(
              ts_rank_cd(to_tsvector('simple', COALESCE(p.body, '')), tsq.query)
            ) AS body_rank
            FROM posts p
            WHERE p.thread_id = t.id
              AND p.is_deleted = false
              AND to_tsvector('simple', COALESCE(p.body, '')) @@ tsq.query
          ) AS post_rank ON true
          WHERE
            to_tsvector('simple', COALESCE(t.title, '')) @@ tsq.query
            OR post_rank.body_rank IS NOT NULL
        )
        SELECT *, COUNT(*) OVER()::int AS total_count
        FROM ranked
        ORDER BY rank_score DESC, last_reply_at DESC NULLS LAST
        LIMIT $2 OFFSET $3
      `, [q, limit, offset]);

      const total = rows[0]?.total_count || 0;
      const results = rows.map(({ total_count, ...row }) => row);
      const payload = {
        results,
        query: q,
        page,
        limit,
        total,
        next_page: offset + results.length < total ? page + 1 : null,
      };

      setCache(cacheKey, payload);
      return res.json(payload);
    }

    if (type === 'users') {
      const { rows } = await db.query(`
        SELECT
          u.id,
          u.username,
          u.bio,
          u.avatar_url,
          u.created_at,
          COUNT(t.id)::int AS thread_count,
          COUNT(p.id)::int AS post_count,
          COUNT(*) OVER()::int AS total_count
        FROM users u
        LEFT JOIN threads t ON t.user_id = u.id
        LEFT JOIN posts p ON p.user_id = u.id AND p.is_deleted = false
        WHERE
          LOWER(u.username) LIKE LOWER($1)
          OR LOWER(COALESCE(u.bio, '')) LIKE LOWER($1)
        GROUP BY u.id
        ORDER BY thread_count DESC, post_count DESC, u.created_at DESC
        LIMIT $2 OFFSET $3
      `, [`%${q}%`, limit, offset]);

      const total = rows[0]?.total_count || 0;
      const results = rows.map(({ total_count, ...row }) => row);
      const payload = {
        results,
        query: q,
        page,
        limit,
        total,
        next_page: offset + results.length < total ? page + 1 : null,
      };

      setCache(cacheKey, payload);
      return res.json(payload);
    }

    const payload = { results: [], query: q, page, limit, total: 0, next_page: null };
    setCache(cacheKey, payload);
    return res.json(payload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
