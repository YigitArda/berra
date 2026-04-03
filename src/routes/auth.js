const express   = require('express');
const { body }  = require('express-validator');
const router    = express.Router();
const ctrl      = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Kayıt doğrulama kuralları
const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 40 }).withMessage('Kullanıcı adı 3-40 karakter olmalı.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Sadece harf, rakam ve alt çizgi kullanılabilir.'),
  body('email')
    .isEmail().withMessage('Geçerli bir email girin.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalı.'),
];

// Giriş doğrulama kuralları
const loginRules = [
  body('email').isEmail().withMessage('Geçerli bir email girin.').normalizeEmail(),
  body('password').notEmpty().withMessage('Şifre boş olamaz.'),
];

router.post('/register',        registerRules, ctrl.register);
router.post('/login',           loginRules,    ctrl.login);
router.post('/logout',                         ctrl.logout);
router.post('/refresh',                        ctrl.refresh);
router.post('/forgot-password',                ctrl.forgotPassword);
router.post('/reset-password',                 ctrl.resetPassword);
router.get ('/me',              requireAuth,   ctrl.me);

module.exports = router;
