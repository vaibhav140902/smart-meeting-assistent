const asyncHandler = require('express-async-handler');
const User = require('../models/User');  // Default export - no curly braces
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const logger = require('../middleware/logger');
const { cache } = require('../config/redis');

// Verify User model loaded correctly
if (typeof User === 'undefined' || !User.name) {
  logger.error("FATAL ERROR: User Model failed to load. Check models/User.js");
  process.exit(1);
} else {
  logger.info(`✅ User Model loaded successfully: ${User.name}`);
}

/**
 * Generate JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Send token response
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user.id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * Register new user
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    isEmailVerified: false,
  });

  logger.info(`New user registered: ${email}`);

  // Send token response
  sendTokenResponse(user, 201, res, 'User registered successfully');
});

/**
 * Login user
 * 🔥 FIX: Removed incorrect .scope() chaining
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Find user with password - findByEmail already uses withPassword scope
  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.',
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Cache user data (optional)
  if (cache && cache.set) {
    try {
      await cache.set(`user:${user.id}`, JSON.stringify(user), 300);
    } catch (err) {
      logger.warn('Cache set failed:', err.message);
    }
  }

  logger.info(`User logged in: ${email}`);

  // Send token response
  sendTokenResponse(user, 200, res, 'Login successful');
});

/**
 * Google OAuth - Initiate
 * 🔥 FIX: Added missing googleAuth function
 */
const googleAuth = (req, res, next) => {
  // This is handled by passport middleware in routes
  // Just a placeholder for the export
};

/**
 * Google OAuth callback
 * 🔥 FIX: Renamed to googleAuthCallback to match routes
 */
const googleAuthCallback = asyncHandler(async (req, res) => {
  // User is authenticated by passport
  const user = req.user;

  if (!user) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }

  logger.info(`Google OAuth successful for: ${user.email}`);

  // Generate token
  const token = generateToken(user.id);

  // Cache user data
  if (cache && cache.set) {
    try {
      await cache.set(`user:${user.id}`, JSON.stringify(user), 300);
    } catch (err) {
      logger.warn('Cache set failed:', err.message);
    }
  }

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Redirect to frontend with token
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
});

// Alias for backward compatibility with routes
const googleCallback = googleAuthCallback;

/**
 * Verify email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required',
    });
  }

  const user = await User.findOne({
    where: {
      verificationToken: token,
    },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token',
    });
  }

  // Check if token is expired
  if (user.verificationExpires && new Date() > user.verificationExpires) {
    return res.status(400).json({
      success: false,
      message: 'Verification token has expired',
    });
  }

  // Update user
  user.isEmailVerified = true;
  user.verificationToken = null;
  user.verificationExpires = null;
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

/**
 * Resend verification email
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified',
    });
  }

  // TODO: Generate and send verification email
  res.json({
    success: true,
    message: 'Verification email sent',
  });
});

/**
 * Refresh access token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    // Send new token
    sendTokenResponse(user, 200, res, 'Token refreshed successfully');
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
});

// ============================================================
// PROTECTED ROUTES
// ============================================================

/**
 * Verify token validity
 */
const verifyToken = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      fullName: req.user.fullName,
      role: req.user.role,
    },
  });
});

/**
 * Get current user (getMe)
 * 🔥 FIX: Added getMe alias for routes compatibility
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      phone: user.phone,
      timezone: user.timezone,
      preferences: user.preferences,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
});

/**
 * Get current user (alias for backward compatibility)
 */
const getCurrentUser = getMe;

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (token) {
    try {
      // Blacklist the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

      if (expiresIn > 0 && cache && cache.set) {
        await cache.set(`blacklist:${token}`, 'true', expiresIn);
      }

      // Clear user cache
      if (cache && cache.del) {
        await cache.del(`user:${req.user.id}`);
      }
    } catch (err) {
      logger.warn('Token verification failed during logout:', err.message);
    }
  }

  logger.info(`User logged out: ${req.user.email}`);

  // Clear cookie
  res.clearCookie('token');

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Update password
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.scope('withPassword').findByPk(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify old password
  const isPasswordValid = await user.comparePassword(oldPassword);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Clear user cache
  if (cache && cache.del) {
    try {
      await cache.del(`user:${user.id}`);
    } catch (err) {
      logger.warn('Cache delete failed:', err.message);
    }
  }

  logger.info(`Password updated for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password updated successfully',
  });
});

// ============================================================
// MODULE EXPORTS
// 🔥 FIX: Added both googleCallback and googleAuthCallback
// ============================================================

module.exports = {
  // Public
  register,
  login,
  googleAuth,           // ✅ Added
  googleAuthCallback,   // ✅ Main export
  googleCallback,       // ✅ Alias for backward compatibility
  verifyEmail,
  resendVerification,
  refreshToken,

  // Protected
  verifyToken,
  getMe,                // ✅ Added (main one used by routes)
  getCurrentUser,       // ✅ Kept for backward compatibility
  logout,
  updatePassword,
};