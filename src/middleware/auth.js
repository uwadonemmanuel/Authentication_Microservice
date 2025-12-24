const passport = require('passport');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * JWT Authentication middleware
 */
exports.authenticate = passport.authenticate('jwt', { session: false });

/**
 * Optional authentication - doesn't fail if no token
 */
exports.optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

/**
 * Check if user is verified
 */
exports.requireVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({ error: 'Email verification required' });
  }

  next();
};

/**
 * Audit logging middleware
 */
exports.auditLog = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Log after response is sent
    setImmediate(async () => {
      try {
        await AuditLog.create({
          userId: req.user?.id || null,
          action: req.method,
          resource: req.path,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent') || '',
          metadata: {
            body: req.method !== 'GET' ? req.body : undefined,
            query: req.query,
            params: req.params,
          },
          status: res.statusCode < 400 ? 'success' : res.statusCode < 500 ? 'failure' : 'error',
        });
      } catch (error) {
        logger.error('Failed to create audit log:', error);
      }
    });

    return originalSend.call(this, data);
  };

  next();
};

