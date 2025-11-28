// ==========================================
// rateLimiter.js — WORKING MEMORY VERSION
// ==========================================

const rateLimit = require("express-rate-limit");
const logger = require("./logger");

// AUTH limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Try again later."
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many attempts. Try again later."
    });
  }
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});

module.exports = {
  authLimiter,
  apiLimiter
};
