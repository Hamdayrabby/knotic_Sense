const Subscription = require('../Models/Subscription');

// Quota definitions per plan
const QUOTAS = {
  free: 3,
  pro: 50,
  teams: 1000 // practically unlimited for individuals
};

/**
 * Middleware to enforce SaaS plan limits on AI features
 */
const checkAiQuota = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Find or create user subscription
    let sub = await Subscription.findOne({ user: req.user.id });
    if (!sub) {
      sub = await Subscription.create({ user: req.user.id, plan: 'free', status: 'active' });
    }

    // Check and reset monthly usage counters if billing cycle rolled over
    await sub.resetUsageIfNeeded();

    // Enforce limits
    const allowedLimit = QUOTAS[sub.plan] || QUOTAS.free;
    
    if (sub.aiAnalysesUsedThisMonth >= allowedLimit) {
      return res.status(403).json({
        success: false,
        message: `You have reached the monthly AI analysis limit of your ${sub.plan.toUpperCase()} plan (${allowedLimit} requests). Please upgrade to continue analyzing resumes.`
      });
    }

    // Attach subscription object to request for controller incrementation
    req.subscription = sub;
    next();
  } catch (error) {
    console.error('AI Quota Middleware Error:', error);
    // Fallback: don't block the request if database checks fail, but log it
    next();
  }
};

module.exports = { checkAiQuota };
