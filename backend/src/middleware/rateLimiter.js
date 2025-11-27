const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');
const logger = require('./logger');

// General API rate limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
});

// Authentication rate limiter
const authLimiter = rateLimit({
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later',
    });
  },
});

// Upload rate limiter
const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:upload:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each user to 20 uploads per hour
  message: 'Too many uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for user: ${req.user?.id}`);
    res.status(429).json({
      success: false,
      message: 'Too many uploads, please try again later',
    });
  },
});

// Create meeting rate limiter
const meetingLimiter = rateLimit({
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:meeting:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 meeting creations per hour
  message: 'Too many meeting creations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    logger.warn(`Meeting rate limit exceeded for user: ${req.user?.id}`);
    res.status(429).json({
      success: false,
      message: 'Too many meeting creations, please try again later',
    });
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  meetingLimiter,
};