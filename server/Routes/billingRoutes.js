const express = require('express');
const router = express.Router();
const { authenticate } = require('../Middleware/authMiddleware');
const { createCheckoutSession, createPortalSession, handleWebhook } = require('../Controllers/BillingController');

// Stripe webhook endpoint (Needs raw body parser on server - handled in app.js/routing)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected subscription management endpoints
router.post('/checkout', authenticate, createCheckoutSession);
router.post('/portal', authenticate, createPortalSession);

module.exports = router;
