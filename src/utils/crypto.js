const crypto = require('crypto');

/**
 * Generate a random token
 * @param {number} bytes - Number of bytes (default: 32)
 * @returns {string} Random hex string
 */
exports.generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a token using SHA256
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
exports.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a secure random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
exports.generateSecureString = (length = 32) => {
  return crypto.randomBytes(length).toString('base64url');
};

