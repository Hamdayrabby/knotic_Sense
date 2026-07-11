const ActivityLog = require('../Models/ActivityLog');

/**
 * Creates a middleware function that logs a specific action to the ActivityLog collection.
 * Requires the authenticate middleware to have run first (req.user must be populated).
 *
 * @param {string} action - One of the enum values from ActivityLog schema
 * @param {function} [getTarget] - Optional fn(req) => { target, targetId, meta }
 */
const logActivity = (action, getTarget = null) => {
  return async (req, res, next) => {
    // Store the original json method so we can intercept it
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      // Only log on successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const extras = getTarget ? getTarget(req, body) : {};
          await ActivityLog.create({
            user: req.user._id || req.user.id,
            userEmail: req.user.email,
            action,
            target: extras.target || null,
            targetId: extras.targetId || null,
            meta: extras.meta || {},
            ip: req.ip || req.headers['x-forwarded-for'] || null,
          });
        } catch (err) {
          // Never block the response due to logging failure
          console.error('[activityLogger] Failed to write log:', err.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Standalone helper — call directly inside a controller when you need
 * more control over what gets logged (e.g. login, where user isn't on req yet).
 */
const writeLog = async ({ userId, userEmail, action, target, targetId, meta, ip }) => {
  try {
    await ActivityLog.create({
      user: userId,
      userEmail,
      action,
      target: target || null,
      targetId: targetId || null,
      meta: meta || {},
      ip: ip || null,
    });
  } catch (err) {
    console.error('[activityLogger] writeLog failed:', err.message);
  }
};

module.exports = { logActivity, writeLog };
