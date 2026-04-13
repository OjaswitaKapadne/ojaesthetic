/**
 * routes/upload.js
 */
const router = require('express').Router();
const { uploadAvatar, uploadReferences } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/avatar',     protect, upload.single('avatar'),            uploadAvatar);
router.post('/references', protect, upload.array('images', 5),          uploadReferences);

module.exports = router;
