// ============================================================
// FILE: backend/src/middleware/errorHandler.js
// PURPOSE: Handle all application errors globally
// ============================================================

// Import logger for logging errors
const logger = require('./logger');

// Import custom error class
const { AppError } = require('../utils/errors');

// ============================================================
// MIDDLEWARE: GLOBAL ERROR HANDLER
// ============================================================

// This middleware catches ALL errors from the entire application
// MUST be the LAST middleware (after all routes)
// Signature: (err, req, res, next) - 4 parameters tells Express it's error handler
const globalErrorHandler = (err, req, res, next) => {
  
  // Set default status code if not specified
  // If error specifies statusCode, use it; otherwise 500 (server error)
  err.statusCode = err.statusCode || 500;
  
  // Set default error message if not specified
  err.message = err.message || 'Internal Server Error';

  // ============================================================
  // LOG THE ERROR
  // ============================================================

  // Log all errors with details
  // Helps developers debug issues in production
  logger.error(`Error: ${err.message}`, {
    statusCode: err.statusCode,      // HTTP status code
    path: req.path,                  // Which URL caused error
    method: req.method,              // GET, POST, etc.
    userId: req.user?.id,            // Which user (if authenticated)
    timestamp: new Date().toISOString(), // When it happened
  });

  // ============================================================
  // HANDLE SPECIFIC ERROR TYPES
  // ============================================================

  // ERROR TYPE 1: Invalid MongoDB ID format
  // Happens when user provides malformed ID
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      // Only show error details in development (security)
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // ERROR TYPE 2: Database validation errors
  // Happens when data doesn't meet database schema requirements
  if (err.name === 'ValidationError') {
    // Extract error messages from all validation failures
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
  }

  // ERROR TYPE 3: Duplicate key error (unique constraint)
  // Happens when trying to create email that already exists
  if (err.code === 11000) {
    // Extract which field caused duplicate
    const field = Object.keys(err.keyValue)[0];
    
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // ERROR TYPE 4: Custom AppError class
  // These are errors we throw intentionally
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      // Show details only in development for security
      error: process.env.NODE_ENV === 'development' ? err.details : undefined,
    });
  }

  // ============================================================
  // DEFAULT ERROR RESPONSE
  // ============================================================

  // For any errors not specifically handled above
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    // Show stack trace in development to help debugging
    // Hide in production for security
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ============================================================
// ASYNC HANDLER WRAPPER
// ============================================================

// This wrapper catches errors in async route handlers
// Without this, errors in async functions won't be caught
// Wraps try-catch automatically
const asyncHandler = (fn) => (req, res, next) => {
  // Execute function and catch any errors
  // Pass errors to globalErrorHandler
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================
// EXPORT ERROR HANDLER FUNCTIONS
// ============================================================

module.exports = {
  globalErrorHandler,  // Main error handler middleware
  asyncHandler,        // Wrapper for async functions
};

// ============================================================
// HOW TO USE IN EXPRESS APP:
// ============================================================

/*
const express = require('express');
const { globalErrorHandler, asyncHandler } = require('./middleware/errorHandler');

const app = express();

// ---- ROUTES (with asyncHandler to catch errors) ----

// Example 1: Route with asyncHandler
app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  // If user not found, throw custom error
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json(user);
}));

// Example 2: Route with try-catch
app.post('/api/users', (req, res, next) => {
  try {
    const user = new User(req.body);
    res.json(user);
  } catch (error) {
    next(error); // Pass to globalErrorHandler
  }
});

// ---- ERROR HANDLER (MUST BE LAST) ----

// This catches ALL errors from the entire app
// Must be after all routes and middleware
app.use(globalErrorHandler);

// ============================================================
// ERROR FLOW EXAMPLE:
// ============================================================

1. User sends request to /api/users/invalid-id
2. Route handler tries to find user
3. Throws CastError (invalid ID format)
4. Caught by try-catch or asyncHandler
5. Passed to globalErrorHandler
6. globalErrorHandler recognizes it as CastError
7. Returns 400 JSON response: "Invalid ID format"
8. Error logged with: path, method, statusCode, timestamp

// ============================================================
// COMMON STATUS CODES:
// ============================================================

200 - OK (success)
201 - Created (resource created)
400 - Bad Request (validation error, wrong format)
401 - Unauthorized (need to login)
403 - Forbidden (authenticated but no permission)
404 - Not Found (resource doesn't exist)
409 - Conflict (duplicate email, etc)
500 - Internal Server Error (server problem)
*/