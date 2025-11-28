/**
 * ================================================
 * AUTH SERVICE - PRODUCTION READY
 * ================================================
 * Handles all authentication business logic
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('./emailService');
const { cache } = require('../config/redis');
const { ValidationError, AuthenticationError } = require('../middleware/errorHandler');
const logger = require('../middleware/logger');

class AuthService {
  
  /**
   * Generate JWT tokens
   */
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Generate email verification token
   */
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Register new user
   */
  async register(userData) {
    const { email, password, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      verificationToken,
      verificationExpires,
      isEmailVerified: false,
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, firstName, verificationToken);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Cache user
    await cache.set(`user:${user.id}`, user, 300);

    logger.info(`User registered: ${email}`);

    return {
      user: user.toJSON(),
      tokens,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    const user = await User.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    if (user.verificationExpires < new Date()) {
      throw new ValidationError('Verification token has expired');
    }

    // Update user
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
    }

    // Clear cache
    await cache.del(`user:${user.id}`);

    logger.info(`Email verified: ${user.email}`);

    return {
      message: 'Email verified successfully',
      user: user.toJSON(),
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    const user = await User.findByEmail(email);

    if (!user) {
      throw new ValidationError('User not found');
    }

    if (user.isEmailVerified) {
      throw new ValidationError('Email already verified');
    }

    // Generate new token
    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();

    // Send email
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

    logger.info(`Verification email resent: ${email}`);

    return {
      message: 'Verification email sent',
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user with password
    const user = await User.scope('withPassword').findByEmail(email);

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new AuthenticationError('Please verify your email before logging in');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AuthenticationError('Your account has been deactivated');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Cache user
    await cache.set(`user:${user.id}`, user, 300);

    logger.info(`User logged in: ${email}`);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  /**
   * Google OAuth login
   */
  async googleLogin(profile) {
    const email = profile.emails[0].value;
    const googleId = profile.id;

    // Find user by Google ID or email
    let user = await User.findByGoogleId(googleId);

    if (!user) {
      user = await User.findByEmail(email);
    }

    if (user) {
      // Update existing user
      user.googleId = googleId;
      user.googleTokens = profile._json;
      user.isEmailVerified = true; // Google emails are pre-verified
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        email,
        googleId,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        profileImage: profile.photos[0]?.value,
        googleTokens: profile._json,
        isEmailVerified: true,
        password: crypto.randomBytes(32).toString('hex'), // Random password
      });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      } catch (error) {
        logger.error('Failed to send welcome email:', error);
      }
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Cache user
    await cache.set(`user:${user.id}`, user, 300);

    logger.info(`Google login: ${email}`);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      // Check if token is blacklisted
      const isBlacklisted = await cache.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new AuthenticationError('Token is no longer valid');
      }

      // Generate new tokens
      const tokens = this.generateTokens(decoded.id);

      logger.info(`Token refreshed for user: ${decoded.id}`);

      return tokens;
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId, accessToken) {
    // Blacklist access token
    const decoded = jwt.decode(accessToken);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    await cache.set(`blacklist:${accessToken}`, 'true', expiresIn);

    // Clear user cache
    await cache.del(`user:${userId}`);

    logger.info(`User logged out: ${userId}`);

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Update password
   */
  async updatePassword(userId, oldPassword, newPassword) {
    const user = await User.scope('withPassword').findByPk(userId);

    if (!user) {
      throw new ValidationError('User not found');
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear cache
    await cache.del(`user:${userId}`);

    logger.info(`Password updated for user: ${userId}`);

    return {
      message: 'Password updated successfully',
    };
  }
}

module.exports = new AuthService();