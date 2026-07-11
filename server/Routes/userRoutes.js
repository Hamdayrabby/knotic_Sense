const express = require('express');
const router = express.Router();
const { authenticate } = require('../Middleware/authMiddleware');
const { updateProfile, updatePassword } = require('../Controllers/UserController');

// All user routes require authentication
router.use(authenticate);

// @route   PUT /api/user/profile
// @desc    Update user profile (name, email)
// @access  Private
router.put('/profile', updateProfile);

// @route   PUT /api/user/password
// @desc    Update user password
// @access  Private
router.put('/password', updatePassword);

module.exports = router;
