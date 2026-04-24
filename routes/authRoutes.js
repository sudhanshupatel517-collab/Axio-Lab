const express = require('express');
const router = express.Router();
const { signup, login, updatePassword, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.put('/update-password', protect, updatePassword);
router.post('/forgot-password', forgotPassword);

module.exports = router;
