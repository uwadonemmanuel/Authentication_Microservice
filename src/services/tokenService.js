const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

exports.generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'access',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

exports.generateRefreshToken = async (user, req) => {
  const token = jwt.sign(
    {
      id: user.id,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token,
    userId: user.id,
    expiresAt,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent') || '',
  });

  return token;
};

exports.verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

