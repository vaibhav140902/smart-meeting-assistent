const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../middleware/logger');

// Generate JWT Token
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Generate Refresh Token
const generateRefreshToken = (payload, expiresIn = process.env.JWT_REFRESH_EXPIRE) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn });
};

// Generate Random Token
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Hash password (deprecated - use bcryptjs in model hooks)
const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Parse pagination params
const getPaginationParams = (query, maxLimit = 100, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

// Format pagination response
const formatPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      current: page,
      total: totalPages,
      count: data.length,
      totalItems: total,
      hasMore: page < totalPages,
    },
  };
};

// Format success response
const formatSuccessResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

// Format error response
const formatErrorResponse = (message, statusCode = 500, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
};

// Calculate duration
const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.floor((end - start) / 1000); // in seconds
};

// Format duration
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
};

// Sanitize object
const sanitizeObject = (obj, fieldsToRemove = []) => {
  const sensitiveFields = ['password', 'twoFactorSecret', 'googleTokens', ...fieldsToRemove];
  const sanitized = { ...obj };

  sensitiveFields.forEach((field) => {
    delete sanitized[field];
  });

  return sanitized;
};

// Paginate array
const paginateArray = (array, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return array.slice(offset, offset + limit);
};

// Group array by property
const groupBy = (array, property) => {
  return array.reduce((groups, item) => {
    const key = item[property];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

// Delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry function with exponential backoff
const retry = async (fn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await delay(delayMs * Math.pow(2, i));
      }
    }
  }
  throw lastError;
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate slug from string
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Check if object is empty
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateRandomToken,
  generateOTP,
  hashPassword,
  getPaginationParams,
  formatPaginationResponse,
  formatSuccessResponse,
  formatErrorResponse,
  calculateDuration,
  formatDuration,
  sanitizeObject,
  paginateArray,
  groupBy,
  delay,
  retry,
  validateEmail,
  generateSlug,
  isEmpty,
  deepClone,
};