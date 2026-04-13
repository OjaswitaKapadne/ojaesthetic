/**
 * routes/newsletter.js
 */
const router = require('express').Router();
const { subscribe, unsubscribe, getAllSubscribers } = require('../controllers/newsletterController');
const { protect, authorize } = require('../middleware/auth');
const { newsletterRules, validate } = require('../middleware/validate');

router.post('/subscribe',   newsletterRules, validate, subscribe);
router.post('/unsubscribe', newsletterRules, validate, unsubscribe);
router.get('/subscribers',  protect, authorize('admin'), getAllSubscribers);

module.exports = router;
