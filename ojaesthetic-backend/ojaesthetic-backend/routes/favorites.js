/**
 * routes/favorites.js
 */
const router = require('express').Router();
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoritesController');
const { protect } = require('../middleware/auth');

router.get('/',        protect, getFavorites);
router.post('/add',    protect, addFavorite);
router.post('/remove', protect, removeFavorite);

module.exports = router;
