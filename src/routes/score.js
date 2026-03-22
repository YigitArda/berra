const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const db      = require('../../config/db');
const { optionalAuth } = require('../middleware/auth');

/*
  SKORLAMA ALGORİTMASI
  ─────────────────────
  Toplam 10 puan. 4 kriter:

  1. Yaş puanı       (0-3)  → ne kadar yeni, o kadar iyi
  2. Km puanı        (0-3)  → düşük km daha iyi
  3. Fiyat/değer     (0-2)  → yıl+km'ye göre piyasa tahmini
  4. Güvenilirlik    (0-2)  → marka güvenilirlik skoru (statik liste)

  Sonuç:
  8-10  → ALINIR  ✓
  5-7.9 → DÜŞÜN   ~
  0-4.9 → ALINMAZ ✗
*/

const CURRENT_YEAR = new Date().getFullYear();

// Marka güvenilirlik skorları (0-2 arası)
const BRAND_RELIABILITY = {
  toyota: 2.0, honda: 2.0, mazda: 1.8, subaru: 1.7,
  volkswagen: 1.5, skoda: 1.5, seat: 1.4, hyundai: 1.6, kia: 1.6,
  renault: 1.3, peugeot: 1.2, citroen: 1.2, fiat: 1.1, dacia: 1.4,
  ford: 1.4, opel: 1.3, bmw: 1.4, mercedes: 1.4, audi: 1.3,
  nissan: 1.5, mitsubishi: 1.6, suzuki: 1.7, volvo: 1.6,
  default: 1.2,
};

function getBrandScore(brand) {
  const key = brand.toLowerCase().trim();
  return BRAND_RELIABILITY[key] ?? BRAND_RELIABILITY.default;
}

function calcAgeScore(year) {
  const age = CURRENT_YEAR - year;
  if (age <= 2)  return 3.0;
  if (age <= 5)  return 2.5;
  if (age <= 8)  return 2.0;
  if (age <= 12) return 1.3;
  if (age <= 18) return 0.7;
  return 0.2;
}

function calcKmScore(km) {
  if (km <= 30000)  return 3.0;
  if (km <= 60000)  return 2.5;
  if (km <= 100000) return 1.8;
  if (km <= 150000) return 1.0;
  if (km <= 200000) return 0.5;
  return 0.1;
}

function calcPriceScore(price, year, km) {
  // Kaba piyasa değeri tahmini: yeni araç ≈ 1.5M TL, her yıl %12 yıpranma
  const age           = CURRENT_YEAR - year;
  const baseValue     = 1_500_000;
  const ageFactor     = Math.pow(0.88, age);
  const kmFactor      = Math.max(0.6, 1 - km / 800_000);
  const estimatedValue = baseValue * ageFactor * kmFactor;
  const ratio          = price / estimatedValue;

  if (ratio <= 0.75) return 2.0; // Piyasanın altında — iyi fırsat
  if (ratio <= 0.95) return 1.6;
  if (ratio <= 1.10) return 1.2; // Piyasa fiyatı
  if (ratio <= 1.30) return 0.7;
  return 0.2;                    // Çok pahalı
}

function getVerdict(score) {
  if (score >= 7.5) return 'alinir';
  if (score >= 5.0) return 'dusun';
  return 'alinmaz';
}

function getVerdictLabel(verdict) {
  return { alinir: 'Alınır ✓', dusun: 'Düşün ~', alinmaz: 'Alınmaz ✗' }[verdict];
}

// POST /api/score
router.post('/', optionalAuth, [
  body('brand').trim().notEmpty().withMessage('Marka zorunlu.'),
  body('model').trim().notEmpty().withMessage('Model zorunlu.'),
  body('year').isInt({ min: 1980, max: CURRENT_YEAR + 1 }).withMessage('Geçerli bir yıl girin.'),
  body('km').isInt({ min: 0 }).withMessage('Km sıfır veya pozitif olmalı.'),
  body('price').isFloat({ min: 1 }).withMessage('Geçerli bir fiyat girin.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { brand, model, year, km, price } = req.body;

  const ageScore    = calcAgeScore(year);
  const kmScore     = calcKmScore(km);
  const priceScore  = calcPriceScore(price, year, km);
  const brandScore  = getBrandScore(brand);
  const total       = parseFloat((ageScore + kmScore + priceScore + brandScore).toFixed(2));
  const verdict     = getVerdict(total);

  const details = {
    yas_puani:      ageScore,
    km_puani:       kmScore,
    fiyat_puani:    priceScore,
    guvenilirlik:   brandScore,
    toplam:         total,
    verdict_label:  getVerdictLabel(verdict),
  };

  // Kayıt et (misafirler de kaydedilir, user_id null olur)
  try {
    await db.query(`
      INSERT INTO car_scores (user_id, brand, model, year, km, price, score, verdict, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [req.user?.id ?? null, brand, model, year, km, price, total, verdict, JSON.stringify(details)]);
  } catch (err) {
    console.error('car_scores insert error:', err);
  }

  res.json({ score: total, verdict, details });
});

// GET /api/score/stats — en çok sorgulanan markalar
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT brand, COUNT(*) AS total,
             ROUND(AVG(score)::numeric, 2) AS avg_score
      FROM car_scores
      GROUP BY brand
      ORDER BY total DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
