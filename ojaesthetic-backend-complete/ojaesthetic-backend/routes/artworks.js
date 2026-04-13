/**
 * routes/artworks.js
 */

const router = require('express').Router();
const {
  getAllArtworks, getArtwork, createArtwork,
  updateArtwork, deleteArtwork, downloadArtwork,
} = require('../controllers/artworkController');
const { protect, authorize } = require('../middleware/auth');
const { artworkRules, validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');

// Public
router.get('/',           getAllArtworks);
router.get('/:id',        getArtwork);
router.get('/:id/download', downloadArtwork);

// Admin only
router.post('/',
  protect, authorize('admin'),
  upload.single('image'),
  artworkRules, validate,
  createArtwork
);
router.patch('/:id',
  protect, authorize('admin'),
  upload.single('image'),
  updateArtwork
);
router.delete('/:id',
  protect, authorize('admin'),
  deleteArtwork
);

module.exports = router;
