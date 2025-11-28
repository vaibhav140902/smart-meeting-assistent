/**
 * ================================================
 * AUTH ROUTES - PRODUCTION READY
 * ================================================
 */

const express = require('express');
const router = express.Router();
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

// Register new user
router.post(
  '/register',
  authLimiter,
  validateRegister,
  authController.register
);

// Login with email/password
router.post(
  '/login',
  authLimiter,
  validateLogin,
  authController.login
);

// Verify email
router.post(
  '/verify-email',
  authController.verifyEmail
);

// Resend verification email
router.post(
  '/resend-verification',
  authLimiter,
  validateEmail,
  authController.resendVerification
);

// Refresh access token
router.post('/refresh-token', authController.refreshToken);

// Google OAuth callback
router.get('/google/callback', authController.googleCallback);

// ============================================================
// PROTECTED ROUTES (Require authentication)
// ============================================================

// Verify token validity
router.get('/verify', protect, authController.verifyToken);

// Get current user profile
router.get('/me', protect, authController.getCurrentUser);

// Logout user
router.post('/logout', protect, authController.logout);

// Update password
router.put(
  '/update-password',
  protect,
  validateUpdatePassword,
  authController.updatePassword
);

module.exports = router;