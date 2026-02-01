const crypto = require('crypto');

/**
 * Generate a short hash for content-based cache invalidation
 * Uses MD5 for speed (collision resistance not important for cache invalidation)
 * @param {Object|string} content - Content to hash
 * @returns {string} 8-character hash
 */
const generateContentHash = (content) => {
    if (!content) return null;
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
};

module.exports = { generateContentHash };
