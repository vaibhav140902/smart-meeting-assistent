/**
 * ================================================
 * AUTH ROUTES - JWT-BASED AUTHENTICATION
 * ================================================
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateUpdatePassword,
  validateEmail,
} = require('../middleware/validation');

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

/**
 * @route   POST /auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authLimiter, validateRegister, authController.register);

/**
 * @route   POST /auth/login
 * @desc    Login with email/password
 * @access  Public
 */
router.post('/login', authLimiter, validateLogin, authController.login);

/**
 * @route   POST /auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @route   POST /auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', authLimiter, validateEmail, authController.resendVerification);

/**
 * @route   POST /auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken);

// ============================================================
// GOOGLE OAUTH ROUTES
// ============================================================

/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true, // We need session for OAuth flow
  })
);

/**
 * @route   GET /auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login?error=auth_failed` : '/login',
    session: true,
  }),
  authController.googleCallback
);

// ============================================================
// PROTECTED ROUTES (Require JWT authentication)
// ============================================================

/**
 * @route   GET /auth/verify
 * @desc    Verify JWT token validity
 * @access  Private
 */
router.get('/verify', protect, authController.verifyToken);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, authController.getCurrentUser);

/**
 * @route   POST /auth/logout
 * @desc    Logout user (blacklist token)
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

/**
 * @route   PUT /auth/update-password
 * @desc    Update password
 * @access  Private
 */
router.put('/update-password', protect, validateUpdatePassword, authController.updatePassword);

module.exports = router;