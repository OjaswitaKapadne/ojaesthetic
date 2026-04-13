/**
 * routes/auth.js
 */

const router = require('express').Router();
const {
  signup, login, logout, getMe, updateProfile, changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { signupRules, loginRules, validate } = require('../middleware/validate');

router.post('/signup',          signupRules, validate, signup);
router.post('/login',           loginRules,  validate, login);
router.post('/logout',          protect,               logout);
router.get('/me',               protect,               getMe);
router.patch('/update-profile', protect,               updateProfile);
router.patch('/change-password',protect,               changePassword);

module.exports = router;
