const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
// 💡 FIX: Import models from the centralized index.js file for proper Sequelize initialization
const db = require('../models');
const User = db.User; 
const logger = require('./logger');
const { cache } = require('../config/redis');

/**
 * Protect routes - Verify JWT token (Used for required authentication)
 * NOTE: If your routes file (e.g., meetingRoutes.js) uses 'authenticate', 
 * you must update the import and usage there to use 'protect'.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Get token from Bearer header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Get token from cookie
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    logger.warn('No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - No token provided',
    });
  }

  try {
    // Check if token is blacklisted
    if (cache && cache.get) {
      try {
        const blacklisted = await cache.get(`blacklist:${token}`);
        if (blacklisted) {
          logger.warn('Attempt to use blacklisted token');
          return res.status(401).json({
            success: false,
            message: 'Token has been revoked',
          });
        }
      } catch (err) {
        logger.warn('Cache check failed:', err.message);
      }
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to get user from cache first
    let user = null;
    if (cache && cache.get) {
      try {
        const cachedUser = await cache.get(`user:${decoded.id}`);
        if (cachedUser) {
          // Parse the JSON string retrieved from cache
          user = JSON.parse(cachedUser); 
          // Ensure that if user is loaded from cache, it still looks like a Sequelize model instance 
          // to maintain consistency, though for simple data access, a plain object is often fine.
          // For now, we trust the cached data has the necessary properties.
          logger.debug(`User ${decoded.id} loaded from cache`);
        }
      } catch (err) {
        logger.warn('Cache get failed:', err.message);
      }
    }

    // If not in cache, get from database
    // Ensure we use User from db.User which is the Sequelize model object
    if (!user) {
      user = await User.findByPk(decoded.id);
      
      if (!user) {
        logger.warn(`User not found: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: 'User no longer exists',
        });
      }

      // Cache user for future requests
      if (cache && cache.set) {
        try {
          // Stringify the user object before caching
          await cache.set(`user:${user.id}`, JSON.stringify(user.toJSON()), 300);
        } catch (err) {
          logger.warn('Cache set failed:', err.message);
        }
      }
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn(`Inactive user attempted access: ${user.email}`);
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
});

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Note: If user is loaded from cache (plain object), req.user.role will work.
    // If loaded from DB, it's a Sequelize instance, and req.user.role also works.
    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.email} attempted unauthorized access to ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

/**
 * Optional authentication - doesn't block if no token
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Use the correctly imported User model
    const user = await User.findByPk(decoded.id);
    
    if (user && user.isActive) {
      // Attach the user instance to the request
      req.user = user;
    }
  } catch (error) {
    logger.debug('Optional auth token invalid:', error.message);
  }

  next();
});

const adminOnly = asyncHandler(async (req, res, next) => {
  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
});

// Export it
module.exports = {
  protect, // your existing function
  adminOnly // add this
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
};