const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Password strength validation
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Registration validation rules
 */
exports.validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(passwordRegex)
    .withMessage('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  exports.handleValidationErrors,
];

/**
 * Login validation rules
 */
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  exports.handleValidationErrors,
];

/**
 * Password reset request validation
 */
exports.validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  exports.handleValidationErrors,
];

/**
 * Password reset validation
 */
exports.validateResetPassword = [
  body('password')
    .isLength({ min: 8 })
    .matches(passwordRegex)
    .withMessage('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'),
  exports.handleValidationErrors,
];

/**
 * 2FA verification validation
 */
exports.validate2FA = [
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('2FA token must be a 6-digit number'),
  exports.handleValidationErrors,
];

