const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { redis } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Generate OTP for 2FA
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Promise<Object>} Secret and QR code
 */
exports.generateOTPSecret = async (userId, email) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `AuthService (${email})`,
      issuer: 'Auth Microservice',
    });

    // Store secret temporarily in Redis (10 minutes)
    await redis.setEx(`2fa:${userId}`, 600, secret.base32);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
    };
  } catch (error) {
    logger.error('Error generating OTP secret:', error);
    throw error;
  }
};

/**
 * Verify OTP token
 * @param {string} secret - Base32 secret
 * @param {string} token - OTP token to verify
 * @returns {boolean} True if valid
 */
exports.verifyOTP = (secret, token) => {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    return false;
  }
};

/**
 * Get temporary secret from Redis
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Secret or null
 */
exports.getTemporarySecret = async (userId) => {
  try {
    return await redis.get(`2fa:${userId}`);
  } catch (error) {
    logger.error('Error getting temporary secret:', error);
    return null;
  }
};

/**
 * Delete temporary secret from Redis
 * @param {string} userId - User ID
 */
exports.deleteTemporarySecret = async (userId) => {
  try {
    await redis.del(`2fa:${userId}`);
  } catch (error) {
    logger.error('Error deleting temporary secret:', error);
  }
};

