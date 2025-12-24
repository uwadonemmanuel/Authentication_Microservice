const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticate, requireVerification, auditLog } = require('../middleware/auth');
const {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validate2FA,
} = require('../middleware/validator');

// Public routes
router.post('/register', apiLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, validateResetPassword, authController.resetPassword);
router.post('/refresh', apiLimiter, authController.refreshToken);
router.post('/logout', apiLimiter, authController.logout);

// OAuth routes
router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/oauth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/oauth/failure' }),
  authController.googleCallback
);

router.get('/oauth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/oauth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/auth/oauth/failure' }),
  authController.githubCallback
);

router.get('/oauth/failure', (req, res) => {
  res.status(401).json({ error: 'OAuth authentication failed' });
});

// 2FA routes
router.post('/2fa/enable', authenticate, requireVerification, authController.enable2FA);
router.post('/2fa/verify', authenticate, requireVerification, validate2FA, authController.verify2FA);
router.post('/2fa/login', apiLimiter, authController.verify2FALogin);

// Protected user routes
router.get('/me', authenticate, requireVerification, auditLog, userController.getProfile);
router.put('/me', authenticate, requireVerification, auditLog, userController.updateProfile);
router.post('/2fa/disable', authenticate, requireVerification, auditLog, userController.disable2FA);
router.get('/sessions', authenticate, requireVerification, auditLog, userController.getSessions);
router.delete('/sessions/:sessionId', authenticate, requireVerification, auditLog, userController.revokeSession);
router.delete('/sessions', authenticate, requireVerification, auditLog, userController.revokeAllSessions);
router.get('/audit-logs', authenticate, requireVerification, auditLog, userController.getAuditLogs);

module.exports = router;

