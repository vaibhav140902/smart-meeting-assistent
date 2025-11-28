/**
 * ================================================
 * AUTHENTICATION MIDDLEWARE
 * ================================================
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { AuthenticationError } = require('./errorHandler');
const { cache } = require('../config/redis');
const logger = require('./logger');

/**
 * Verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      throw new AuthenticationError('No token provided. Please log in.');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is blacklisted
      const isBlacklisted = await cache.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new AuthenticationError('Token is no longer valid. Please log in again.');
      }

      // Try to get user from cache first
      let user = await cache.get(`user:${decoded.id}`);

      if (!user) {
        // If not in cache, get from database
        user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });

        if (!user) {
          throw new AuthenticationError('User no longer exists.');
        }

        // Cache user for 5 minutes
        await cache.set(`user:${decoded.id}`, user, 300);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Your account has been deactivated.');
      }

      // Attach user to request
      req.user = user;
      next();

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token. Please log in again.');
      }
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Your session has expired. Please log in again.');
      }
      throw error;
    }

  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Please log in to access this resource.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AuthenticationError(
          `User role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without user
        logger.debug('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns the resource
 */
const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Please log in to access this resource.'));
    }

    const resourceUserId = req.resource?.[resourceUserIdField];
    
    if (resourceUserId && resourceUserId !== req.user.id && req.user.role !== 'admin') {
      return next(new AuthenticationError('You do not have permission to access this resource.'));
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
};