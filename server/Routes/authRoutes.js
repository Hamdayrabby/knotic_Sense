const express = require('express');
const router = express.Router();
const { register, login } = require('../Controllers/AuthController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/logout
// @desc    Logout user (clear httpOnly cookie)
// @access  Public
router.post('/logout', (req, res) => {
  res.cookie('knotic_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0),
    path: '/'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
