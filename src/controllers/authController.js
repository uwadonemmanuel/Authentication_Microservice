const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const emailService = require('../services/emailService');
const tokenService = require('../services/tokenService');
const otpService = require('../services/otpService');
const { generateToken, hashToken } = require('../utils/crypto');
const logger = require('../utils/logger');

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create verification token
    const verificationToken = generateToken();

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      verificationToken,
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({ error: 'Account is temporarily locked. Please try again later.' });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      // Increment login attempts
      user.loginAttempts += 1;
      
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
      const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 1800000; // 30 minutes
      
      if (user.loginAttempts >= maxAttempts) {
        user.lockUntil = new Date(Date.now() + lockoutTime);
      }
      
      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate temporary token for 2FA verification
      const tempToken = jwt.sign(
        { userId: user.id, type: '2fa' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      
      return res.json({
        requiresTwoFactor: true,
        tempToken,
      });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user, req);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.firstName);

    logger.info(`Email verified: ${user.email}`);

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = generateToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    logger.info(`Password reset requested: ${user.email}`);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Request failed' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    logger.info(`Password reset successful: ${user.email}`);

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken, isRevoked: false },
    });

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findByPk(tokenRecord.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const accessToken = tokenService.generateAccessToken(user);

    res.json({ accessToken });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.update(
        { isRevoked: true },
        { where: { token: refreshToken } }
      );
    }

    logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

exports.enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    const { secret, qrCode } = await otpService.generateOTPSecret(userId, req.user.email);

    res.json({
      secret,
      qrCode,
    });
  } catch (error) {
    logger.error('Enable 2FA error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
};

exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    // Get secret from Redis
    const secret = await otpService.getTemporarySecret(userId);
    if (!secret) {
      return res.status(400).json({ error: 'Setup session expired. Please try again.' });
    }

    // Verify token
    const verified = otpService.verifyOTP(secret, token);
    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA
    const user = await User.findByPk(userId);
    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;
    await user.save();

    // Clear Redis
    await otpService.deleteTemporarySecret(userId);

    logger.info(`2FA enabled: ${user.email}`);

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    logger.error('Verify 2FA error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.verify2FALogin = async (req, res) => {
  try {
    const { tempToken, token } = req.body;

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.type !== '2fa') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Verify 2FA code
    const verified = otpService.verifyOTP(user.twoFactorSecret, token);
    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user, req);

    user.lastLogin = new Date();
    await user.save();

    logger.info(`2FA login successful: ${user.email}`);

    res.json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    logger.error('2FA login error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// OAuth callbacks
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user, req);

    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

exports.githubCallback = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user, req);

    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    logger.error('GitHub OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

