const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    logger.info(`Profile updated: ${user.email}`);

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Disable 2FA
 */
exports.disable2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    logger.info(`2FA disabled: ${user.email}`);

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    logger.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

/**
 * Get user sessions (refresh tokens)
 */
exports.getSessions = async (req, res) => {
  try {
    const sessions = await RefreshToken.findAll({
      where: {
        userId: req.user.id,
        isRevoked: false,
        expiresAt: { [require('sequelize').Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'ipAddress', 'userAgent', 'createdAt', 'expiresAt'],
    });

    res.json({ sessions });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

/**
 * Revoke a session
 */
exports.revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await RefreshToken.findOne({
      where: {
        id: sessionId,
        userId: req.user.id,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.isRevoked = true;
    await session.save();

    logger.info(`Session revoked: ${sessionId} by ${req.user.email}`);

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    logger.error('Revoke session error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
};

/**
 * Revoke all sessions
 */
exports.revokeAllSessions = async (req, res) => {
  try {
    await RefreshToken.update(
      { isRevoked: true },
      {
        where: {
          userId: req.user.id,
          isRevoked: false,
        },
      }
    );

    logger.info(`All sessions revoked: ${req.user.email}`);

    res.json({ message: 'All sessions revoked successfully' });
  } catch (error) {
    logger.error('Revoke all sessions error:', error);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
};

/**
 * Get audit logs for user
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const logs = await AuditLog.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

